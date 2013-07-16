__author__ = 'jakerose27'

from app import app
import os
import json
import random
from flask import render_template, request
from shutil import move, Error, rmtree
from werkzeug.utils import secure_filename

info = []
# Sets the base file directories for the fileviewer
dir_root = os.path.abspath('tree')
# Sets the walker type. Current options are: filesystem
walker_type = "filesystem"


# Determines the file size of a folder by summing the file sizes of its children
def folder_size(dir_path):
    # Resets total_size for recursive / scope purposes
    total_size = 0
    # Runs through the child files and folders to create a sum of file sizes
    for item in os.listdir(dir_path):
        item_path = os.path.join(dir_path, item)
        if os.path.isfile(item_path):
            if item!=".DS_Store":
                total_size += os.path.getsize(item_path)
        elif os.path.isdir(item_path):
            # Recursively returns file sizes of children of children
            total_size += folder_size(item_path)
    return total_size


# Walks a file directory and appends the file information to the global variable info
def file_walk(dir_path):
    dirs_holder = []
    files_holder = []

    # Loops through all files and folders in the directory
    for i in os.listdir(dir_path):
        # Assigns all folders to dirs_holder
        if os.path.isdir(os.path.join(dir_path, i)):
            dirs_holder.append(i)
        # Assigns all files to files_holder
        if os.path.isfile(os.path.join(dir_path, i)):
            if i!=".DS_Store":
                files_holder.append(i)

    # Loops through the folders in the file system
    for d in dirs_holder:
        appender = {}
        appender['type'] = 'folder'
        # Sets the base path top to dir_root
        appender['uid'] = os.path.join(dir_path, d).split(dir_root + os.sep)[1]
        parent = os.path.dirname(appender['uid'])
        # If it has a parent, add the parent information.
        if parent:
            appender['name'] = os.path.basename(appender['uid'])
            appender['parent_uid'] = parent
        # If it doesn't have a parent, just return the path information.
        else:
            appender['parent_uid'] = "null"
            appender['name'] = appender['uid']
        # Calls the function folder_size to get the folder size
        appender['size'] = folder_size(os.path.join(dir_path, d))
        info.append(appender)
        # Recursively calls the file_walk function on all child files and folders
        file_walk(os.path.join(dir_path, d))

    # Loops through the files in the file system
    for f in files_holder:
        appender = {}
        appender['type'] = 'file'
        appender['uid'] = os.path.join(dir_path, f).split(dir_root + os.sep)[1]
        parent = os.path.dirname(appender['uid'])
        # If it has a parent, add the parent information.
        if parent:
            appender['name'] = os.path.basename(appender['uid'])
            appender['parent_uid'] = parent
        # If it doesn't have a parent, just return the path information.
        else:
            appender['parent_uid'] = "null"
            appender['name'] = appender['uid']
        appender['size'] = os.path.getsize(os.path.join(dir_path, f))
        info.append(appender)


walker_router = {
    "filesystem": lambda: file_walk(dir_root)
}[walker_type]


# Main osf-fileviewer page, integrating SlickGrid.js
@app.route('/', methods=['GET', 'POST'])
def index():
    # Clear old instances of info for a fresh data set
    del info[:]

    # Walk the directory to collect file information. Returns "info".
    walker_router()

    tester = [
        {'uid': 'another', 'size': 568, 'type': 'folder', 'name': 'another', 'parent_uid': 'null'},
        {'uid': 'uploads/test3.txt', 'size': 24, 'type': 'file', 'name': 'test3.txt', 'parent_uid': 'uploads'},
        {'uid': 'another/l_dir', 'size': 568, 'type': 'folder', 'name': 'l_dir', 'parent_uid': 'another'},
        {'uid': 'uploads/test2.txt', 'size': 17, 'type': 'file', 'name': 'test2.txt', 'parent_uid': 'uploads'},
        {'uid': 'another/l_dir/check-folder', 'size': 568, 'type': 'folder', 'name': 'check-folder', 'parent_uid': 'another/l_dir'},
        {'uid': 'uploads/test1.txt', 'size': 17, 'type': 'file', 'name': 'test1.txt', 'parent_uid': 'uploads'},
        {'uid': 'another/l_dir/check-folder/checker1.txt', 'size': 72, 'type': 'file', 'name': 'checker1.txt', 'parent_uid': 'another/l_dir/check-folder'},
        {'uid': 'uploads', 'size': 58, 'type': 'folder', 'name': 'uploads', 'parent_uid': 'null'},
        {'uid': 'another/l_dir/check-folder/checker3.txt', 'size': 486, 'type': 'file', 'name': 'checker3.txt', 'parent_uid': 'another/l_dir/check-folder'},
        {'uid': 'another/l_dir/check-folder/FileView.py', 'size': 10, 'type': 'file', 'name': 'FileView.py', 'parent_uid': 'another/l_dir/check-folder'}
    ]

    tester2 = [
        {'uid': 1, 'size': 568, 'type': 'folder', 'name': 'skaters', 'parent_uid': 'null'},
        {'uid': 4, 'size': 568, 'type': 'folder', 'name': 'soccer_players', 'parent_uid': 'null'},
        {'uid': 5, 'size': 568, 'type': 'folder', 'name': 'pro', 'parent_uid': 4},
        {'uid': 8, 'size': 568, 'type': 'folder', 'name': 'regular', 'parent_uid': 4},
        {'uid': 11, 'size': 568, 'type': 'folder', 'name': 'bad', 'parent_uid': 8},
        {'uid': 2, 'size': 568, 'type': 'file', 'name': 'tony', 'parent_uid': 1},
        {'uid': 3, 'size': 568, 'type': 'file', 'name': 'bucky', 'parent_uid': 1},
        {'uid': 6, 'size': 568, 'type': 'file', 'name': 'ronaldo', 'parent_uid': 5},
        {'uid': 7, 'size': 568, 'type': 'file', 'name': 'messi', 'parent_uid': 5},
        {'uid': 9, 'size': 568, 'type': 'file', 'name': 'jake', 'parent_uid': 8},
        {'uid': 10, 'size': 568, 'type': 'file', 'name': 'laura', 'parent_uid': 8},
        {'uid': 12, 'size': 568, 'type': 'file', 'name': 'torres', 'parent_uid': 11}
    ]
    randint = random.randint(0, 1000)
    #print json.dumps(info)  # A test line to verify that the output is correct / in the correct format.
    return render_template("index.html", info=json.dumps(info), randint=randint)


# # The script to route all file calls to the proper walker and file manipulator
# @app.route('/routing', methods=['GET', 'Post'])
# def routing():
#

# The script to upload files from Dropzone.js
@app.route('/uploader', methods=['GET', 'POST'])
def uploader():
    # Make sure the data is sent by a POST method
    if request.method == 'POST':
        print "The method was a POST"
        # Instantiates the date from the POST request
        requested_file = request.files['file']
        print request.files #test!
        # Verifies that a file was passed to the page
        new_file_name = secure_filename(requested_file.filename)
        # Set the folder for the upload
        upload_folder = request.form['destination']
        # Set the file system path to the upload folder
        uploader_dir = os.path.join(dir_root, upload_folder) # Make sure that they can't create a separate uploads folder? / rewrite this?
        if requested_file:
            print "The file was posted"
            print new_file_name  # A test line to verify that the output is correct / in the correct format.
            # Saves the file to the directory
            new_file_path = os.path.join(uploader_dir, new_file_name)
            if os.path.exists(new_file_path):
                return "Repeat"
            else:
                requested_file.save(new_file_path)
                # Create a new item and send it back to SlickGrid to rerender
                info_append = []
                new_info_item = {}
                new_info_item['name'] = requested_file.filename
                new_info_item['uid'] = os.path.join(upload_folder, requested_file.filename)
                new_info_item['parent_uid'] = upload_folder
                new_info_item['uploader_path'] = os.path.join(upload_folder, requested_file.filename)
                new_info_item['size'] = os.path.getsize(os.path.join(uploader_dir, requested_file.filename))
                new_info_item['type'] = "file"
                info_append.append(new_info_item)
                return json.dumps(info_append)
        # No file was passed to the page
        else:
            print "The requested file was not posted - no file sent in the request"
    # The data was not sent by a POST method
    else:
        print "The file must be sent by POST"


# Move the files passed from the Grid
@app.route('/sg_move', methods=['GET', 'POST'])
def sg_move():
    src_load = json.loads(request.form['src'])
    dest_load = json.loads(request.form['dest'])
    print dest_load
    for index in range(len(src_load)):
        src = os.path.join(dir_root, src_load[index])
        print dest_load
        if dest_load is None:
            dest=dir_root
            response = json.dumps(src_load[index])
        else:
            dest = os.path.join(dir_root, dest_load)
            response = json.dumps(dest_load)

        # A test line to verify that the output is correct / in the correct format.
        try:
            move(src, dest)
            print 'Moving %s to %s' % (src, dest)
        except Error:
            return "fail"

    return "success"


# Delete Files passed by the grid
@app.route('/file_deleter', methods=['GET', 'POST'])
def file_deleter():
    item = json.loads(request.form['grid_item'])
    file_name = item['name']
    file_path = os.path.join(dir_root, item['uid'])
    # print file_path

    if item['uid']=="uploads":
        return "fail"

    print file_name
    if file_path.find(dir_root) == 0 :
        if item['type'] == "file":
            try:
                #os.remove(file_path)
                print 'Deleting %s at %s' % (file_name, file_path)
            except Error:
                return "fail"
        else:
            try:
                #rmtree(file_path)
                print 'Deleting %s at %s' % (file_name, file_path)
            except Error:
                return "fail"
    return file_name

# Edit the file name passed from the Grid
@app.route('/sg_edit', methods=['GET', 'POST'])
def sg_edit():
    item = json.loads(request.form['grid_item'])
    old_title = os.path.join(dir_root, item['uid'])
    print item
    if item['uid']=="uploads":
        return "fail"

    if 'parent_uid' in item:
        parent_path = os.path.join(dir_root, item['parent_uid'])
        new_path = os.path.join(item['parent_uid'], item['name'])
    else:
        parent_path = dir_root
        new_path = item['name']
    new_title = os.path.join(parent_path, item['name'])
    print old_title
    print new_title
    try:
        move(old_title, new_title)
        print 'Changing name from %s to %s' % (os.path.basename(old_title), os.path.basename(new_title))
    except Error:
        return "fail"
    return new_path