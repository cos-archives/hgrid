__author__ = 'jakerose27'

from app import app
import os
import json
from flask import render_template, request
from hurry.filesize import size, alternative

info = []
# Sets the base file directories for the fileviewer
dir_root = os.path.abspath('tree')


# Determines the file size of a folder by summing the file sizes of its children
def folder_size(dir_path):
    # Resets total_size for recursive / scope purposes
    total_size = 0
    # Runs through the child files and folders to create a sum of file sizes
    for item in os.listdir(dir_path):
        item_path = os.path.join(dir_path, item)
        if os.path.isfile(item_path):
            total_size += os.path.getsize(item_path)
        elif os.path.isdir(item_path):
            # Recursively returns file sizes of children of children
            total_size += folder_size(item_path)
    return total_size


# Walks a file directory and appends the file information to the global variable info
def walk(dir_path):
    dirs_holder = []
    files_holder = []

    # Loops through all files and folders in the directory
    for i in os.listdir(dir_path):
        # Assigns all folders to dirs_holder
        if os.path.isdir(os.path.join(dir_path, i)):
            dirs_holder.append(i)
        # Assigns all files to files_holder
        elif os.path.isfile(os.path.join(dir_path, i)):
            files_holder.append(i)

    # Loops through the folders in the file system
    for d in dirs_holder:
        appender = {}
        appender['type'] = 'folder'
        # Sets the base path top to dir_root
        appender['path'] = os.path.join(dir_path, d).split(dir_root + os.sep)[1]
        parent = os.path.dirname(appender['path'])
        # If it has a parent, add the parent information.
        if parent:
            appender['name'] = os.path.basename(appender['path'])
            appender['parent_path'] = parent
            appender['parent'] = os.path.basename(parent)
        # If it doesn't have a parent, just return the path information.
        else:
            appender['name'] = appender['path']
        # Calls the function folder_size to get the folder size
        appender['size'] = folder_size(os.path.join(dir_path, d))
        info.append(appender)
        # Recursively calls the walk function on all child files and folders
        walk(os.path.join(dir_path, d))

    # Loops through the files in the file system
    for f in files_holder:
        appender = {}
        appender['type'] = 'file'
        appender['path'] = os.path.join(dir_path, f).split(dir_root + os.sep)[1]
        parent = os.path.dirname(appender['path'])
        # If it has a parent, add the parent information.
        if parent:
            appender['name'] = os.path.basename(appender['path'])
            appender['parent_path'] = parent
            appender['parent'] = os.path.basename(parent)
        # If it doesn't have a parent, just return the path information.
        else:
            appender['name'] = appender['path']
        appender['size'] = os.path.getsize(os.path.join(dir_path, f))
        info.append(appender)


# Generates an HTML table for Treetable.js - Returns html #
def table_gen(info):
    info = info
    dir_parts = {'paths': {}}
    html = '<thead>\n<tr>\n<th>Name</th>\n<th>Kind</th>\n<th>Size</th>\n</tr>\n</thead>\n<tbody>'

    # Loops through info to create a hierarchy for Treetable.js
    for info_dict in info:
        # The folder indent / hierarchy counter
        counter = []
        temp_dir_parts = dir_parts
        relative_root = info_dict['path']
        parts = relative_root.split(os.sep)

        # Checks if the directory exists in the list
        for part in parts:
            # Path has already been encountered
            if part in temp_dir_parts['paths']:
                # Append this level's count to our part's counter
                counter.append(str(len(temp_dir_parts['paths'])))

            # New path segment
            else:
                counter.append(str(len(temp_dir_parts['paths'])+1))
                # Create this new part, with a value of 1.
                if info_dict['type'] is 'folder':
                    temp_dir_parts['paths'][part] = {'paths': {}}
                else:
                    temp_dir_parts['paths'][part] = {'paths': None}

            temp_dir_parts = temp_dir_parts['paths'][part]

        # Checking if this is a file
        if temp_dir_parts['paths'] is None:
            img_type = '<span class="file">'
            file_type = '<td>File</td>'
            file_size = '<td>{sizer}</td>'.format(sizer=size(info_dict['size'], system=alternative))
        # This is a folder
        else:
            img_type = '<span class="folder">'
            file_type = '<td>Folder</td>'
            file_size = '<td>{sizer}</td>'.format(sizer='--')

        # If the folder depth is below the top level
        if len(counter) > 1:
            parent_count = counter[:]
            del parent_count[len(parent_count)-1]
            # Creates a number value for the parent folder
            parent_id = '-'.join(parent_count)
            # Creates a number value for the current folder
            current_id = '-'.join(counter)
            html += '<tr data-tt-id="{current_id}" data-tt-parent-id="{parent_id}" data-path="{path}">' \
                    '<td>{img_type}{name}' \
                    '</span></td>{file_type}{size}</tr>\n'.format(current_id=current_id, parent_id=parent_id,
                                                                  path=relative_root, img_type=img_type,
                                                                  name=part, file_type=file_type, size=file_size)
        else:
            current_id = '-'.join(counter)
            html += '<tr data-tt-id="{current_id}" data-path="{path}"><td>{img_type}{name}</span>' \
                    '</td>{file_type}{size}' \
                    '</tr>\n'.format(current_id=current_id, path=relative_root, img_type=img_type,
                                     name=part, file_type=file_type, size=file_size)
    html += '</tbody>\n'
    return html


# Main osf-fileviewer page, integrating SlickGrid.js
@app.route('/', methods=['GET', 'POST'])
def index():
    # Clear old instances of info for a fresh data set
    del info[:]
    # Initialize the unique ID counter for all files
    counter = 0
    # Walk the directory to collect file information. Returns "info".
    walk(dir_root)
    #Set's unique IDs to each item of info
    for i in info:
        i['unique'] = counter
        counter += 1

    print json.dumps(info)  # A test line to verify that the output is correct / in the correct format.
    return render_template("index.html", info=json.dumps(info))


# A test page to integrate Dropzone.js with SlickGrid.js
@app.route('/dropzonify', methods=['GET', 'POST'])
def dropzonify():
    # Clear old instances of info for a fresh data set
    del info[:]
    # Walk the directory to collect file information. Returns "info"
    walk(dir_root)
    print json.dumps(info)  # A test line to verify that the output is correct / in the correct format.
    return render_template("dropzonify.html",
                           info=json.dumps(info))


# The script to upload files from Dropzone.js
@app.route('/uploader', methods=['GET', 'POST'])
def uploader():
    # Make sure the data is sent by a POST method
    if request.method == 'POST':
        print "The method was a POST"
        # Instantiates the date from the POST request
        requested_file = request.files['file']
        # Verifies that a file was passed to the page
        if requested_file:
            print "The file was posted"
            print requested_file  # A test line to verify that the output is correct / in the correct format.
            # Saves the file to the directory
            requested_file.save(os.path.join(dir_root, requested_file.filename))
        # No file was passed to the page
        else:
            print "The requested file was not posted - no file sent in the request"
    # The data was not sent by a POST method
    else:
        print "The file must be sent by POST"


# A test page for displaying the files with Treetable.js
@app.route('/treetable', methods=['GET', 'POST'])
def treetable():
    del info[:]
    # Walk the directory to collect file information. Returns "info"
    walk(dir_root)
    print info  # A test line to verify that the output is correct / in the correct format.
    # Generates the HTML output for treetable
    html = table_gen(info)
    print html  # A test line to verify that the output is correct / in the correct format.
    return render_template("treetable.html",
                           inserter=html)


# The script to move files in Treetable.js
@app.route('/post', methods=['GET', 'POST'])
def post():
    ans = 'Moving %s to %s' % (request.form['src'], request.form['dest'])
    print ans  # A test line to verify that the output is correct / in the correct format.
    return ans