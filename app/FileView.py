__author__ = 'jakerose27'

from app import app
import os
from flask import render_template, request
from hurry.filesize import size, alternative

info = []
root = os.path.abspath('tree')
dirroot = os.path.abspath('tree')


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
        appender['path'] = os.path.join(root, d).split(dirroot + os.sep)[1]
        parent = appender['path'].split(os.sep)
        if len(parent)>1:
            parent.pop()
            appender['parent']= os.sep.join(parent)
        appender['size'] = '--'
        info.append(appender)
        walk(os.path.join(root, d))

    for f in files_holder:
        appender = {}
        appender['type'] = 'file'
        appender['path'] = os.path.join(root, f).split(dirroot + os.sep)[1]
        parent = appender['path'].split(os.sep)
        if len(parent)>1:
            parent.pop()
            appender['parent']= os.sep.join(parent)
        appender['size'] = os.path.getsize(os.path.join(root, f))
        info.append(appender)


def table_gen():
    fs = {'paths':{}}
    abs_root = '/Users/jakerose27/PycharmProjects/FileView/app/tree'
    html = '<thead>\n<tr>\n<th>Name</th>\n<th>Kind</th>\n<th>Size</th>\n</tr>\n</thead>\n<tbody>'

    for info_dict in info:
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
            html += '<tr data-tt-id="{id}" data-tt-parent-id="{par_id}" data-path="{path}"><td>{img_type}{name}' \
                    '</span></td>{file_type}{size}</tr>\n'.format(id=id, par_id=par_id, path=relative_root,
                                                                  img_type=img_type, name=part, file_type=file_type, size = f_size)
        else:
            id = '-'.join(counter)
            html += '<tr data-tt-id="{id}" data-path="{path}"><td>{img_type}{name}</span></td>{file_type}{size}' \
                    '</tr>\n'.format(id=id, path=relative_root, img_type=img_type, name=part, file_type=file_type, size = f_size)
    html += '</tbody>\n'
    return html


@app.route('/', methods=['GET', 'POST'])
def index():
    del info[:]
    walk(root)
    html = table_gen()
    print info
    return render_template("example5-collapsing.html",
                           info = info)

@app.route('/post', methods=['GET', 'POST'])
def post():
    ans = 'Moving %s to %s' % (request.form['src'], request.form['dest'])
    print ans
    return ans