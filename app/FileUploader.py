__author__ = 'Alexander'

from app import app
import os
import json
import cgi
dirroot = os.path.abspath('tree')

form = cgi.FieldStorage()
if (not form):
    print "foo"
else:
#    item = form["file"]
#    if (item.file):
#        itemName = os.path.basename(item.filename)
    print form