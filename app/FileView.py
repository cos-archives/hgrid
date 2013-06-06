__author__ = 'jakerose27'

from app import app
import os
from flask import render_template
from hurry.filesize import size, alternative

json_test = []

info = []
root = '/Users/jakerose27/PycharmProjects/FileView/app/tree'

def walk(root):
    dirs_holder = []
    files_holder = []

    for i in os.listdir(root):
        if os.path.isdir(os.path.join(root, i)):
            dirs_holder.append(i)
        elif os.path.isfile(os.path.join(root, i)):
            files_holder.append(i)
            os.path.getsize(os.path.join(root, i))
        else:
            continue

    for d in dirs_holder:
        appender = {}
        appender['type'] ='folder'
        appender['path'] = os.path.join(root, d).split('tree/')[1]
        appender['size'] = '--'
        info.append(appender)
        walk(os.path.join(root, d))

    for f in files_holder:
        appender = {}
        appender['type'] = 'file'
        appender['path'] = os.path.join(root, f).split('tree/')[1]
        appender['size'] = os.path.getsize(os.path.join(root, f))
        info.append(appender)


# def paths_dict():
#     counter = 1
#     for i in info:
#         adder = i['path'].split('/')
#         adder = adder[len(adder)-1]
#
#         if i['type'] is 'folder':
#             paths[adder] = dict.fromkeys()
#         else:
#             paths[adder] =counter
#         counter+=1
#

# def get_directory_structure(rootdir):
#     """
#     Creates a nested dictionary that represents the folder structure of rootdir
#     """
#     dir = {}
#     rootdir = rootdir.rstrip(os.sep)
#     start = rootdir.rfind(os.sep) + 1
#     print start
#     for path, dirs, files in os.walk(rootdir):
#         folders = path[start:].split(os.sep)
#         subdir = dict.fromkeys(files)
#         parent = reduce(dict.get, folders[:-1], dir)
#         parent[folders[-1]] = subdir
#
#
#     return dir

# print get_directory_structure(root)


def table_gen():
    fs = {'paths':{}}
    abs_root = '/Users/jakerose27/PycharmProjects/FileView/app/tree'
    html = '<thead>\n<tr>\n<th>Name</th>\n<th>Kind</th>\n<th>Size</th>\n</tr>\n</thead>\n<tbody>'

    for info_dict in info:
        # relative_root = root[len(abs_root)+1:]
        relative_root = info_dict['path']
        tmp = fs
        parts = relative_root.split(os.sep)
        #print parts
        counter = []

        for part in parts:
            # Path has already been encountered
            if part in tmp['paths']:
                # append this level's count to our part's counter
                counter.append(str(len(tmp['paths'])))

            # New path segment
            else:
                counter.append( str(len(tmp['paths'])+1) )
                # Create this new part, with a value of 1.
                if(info_dict['type'] is 'folder'):
                    tmp['paths'][part] = {'paths':{}}
                else:
                    tmp['paths'][part] = {'paths': None}

            tmp = tmp['paths'][part]


            # if not part in tmp['paths']:
            #     tmp['paths'][part] = {'index':1, 'paths':{}}
            # else:
            #     tmp['paths'][part]['index']+=1
            #counter.append(str(tmp['paths'][part]['index']))
            #tmp = tmp['paths'][part]
            #print 'Part:%s|tmp:%s' % (part, tmp)
        if tmp['paths'] is None:
            img_type = '<span class="file">'
            file_type = '<td>File</td>'
            f_size = '<td>{sizer}</td>'.format(sizer=size(info_dict['size'], system=alternative))
        else:
            img_type = '<span class="folder">'
            file_type = '<td>Folder</td>'
            f_size = '<td>{sizer}</td>'.format(sizer='--')



        if len(counter)>1:
            par_count = counter[:]
            del par_count[len(par_count)-1]
            par_id = '-'.join(par_count)
            id = '-'.join(counter)
            html += '<tr data-tt-id="{id}" data-tt-parent-id="{par_id}" data-path="{path}"><td>{img_type}{name}</span></td>{file_type}{size}</tr>\n'.format(id=id, par_id=par_id, path=relative_root, img_type=img_type, name=part, file_type=file_type, size = f_size)
        else:
            id = '-'.join(counter)
            html += '<tr data-tt-id="{id}" data-path="{path}"><td>{img_type}{name}</span></td>{file_type}{size}</tr>\n'.format(id=id, path=relative_root, img_type=img_type, name=part, file_type=file_type, size = f_size)
    html += '</tbody>\n</table>\n'
    return html


#<tr data-tt-id='5'><td><span class='folder'>Name</span></td><td>Type</td><td>--</td></tr>
#<tr data-tt-id='9'><td><span class='file'>Xcode Tools License.rtf</span></td><td>File</td><td>18.79 KB</td></tr>
#<tr data-tt-id='5-1-1' data-tt-parent-id='5-1'><td><span class='file'>INSTALL.pod</span></td><td>File</td></tr>

@app.route('/')
def index():
    walk(root)
    for i in info:
     print i
    html = table_gen()
    print info
    del info[:]
    return render_template("index.html",
                           inserter = html)