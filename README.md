# Hgrid

HGrid is a web based data management system integrating [DropzoneJS](http://www.dropzonejs.com/) and [SlickGridJS](https://github.com/mleibman/SlickGrid). It provides a browser interface to organize and manage your data.

## Installation

To install HGrid on your web page, simply copy the /static/ folder to a directory, and copy the following CSS and JS file calls to the page where you intend to have HGrid:
``` html
<link rel="stylesheet" href="../vendor/css/hgrid-base.css" type="text/css" />

<script src="/static/js/jquery-1.7.min.js"></script>
<script src="/static/js/jquery-ui-1.8.16.custom.min.js"></script>
<script src="/static/js/jquery.event.drag-2.2.js"></script>
<script src="/static/js/jquery.event.drop-2.2.js"></script>
<script src="/static/js/slickgrid.custom.min.js"></script>
<script src="/static/js/hgrid.js"></script>
```
This is currently a lot of files for dependencies, and future versions will have condensed this.

#### Creating the Grid

Creating the grid requires two things, the data, and a DIV to display the data.

The data is a JSON String that must be composed as an array of objects with 4 properties: 

* "uid": a unique identifier for the data item
* "parent_uid": the uid of the data item's parent item - null if this item has no parent
* "type": whether this is a "file" (an item with no child items) or a "folder" (an item with child items)
* "name": the name of the data item

An example of an info string:
```js
var data_info = [
  {'uid': 0, 'type': 'folder', 'name': 'skaters', 'parent_uid': 'null'},
  {'uid': 1, 'type': 'folder', 'name': 'pro', 'parent_uid': 0},
  {'uid': 2, 'type': 'file', 'name': 'Tony Hawk', 'parent_uid': 1},
  {'uid': 3, 'type': 'folder', 'name': 'regular', 'parent_uid': 'null'}
]
```        
To initiate the grid, call HGrid.create() and pass it an object with the values for:

* the div that will hold the grid
* the data set that the grid will display
* the columns that will be used by the grid

An example of a javascript call to initiate the grid using the example data above:
```js
var myGrid = HGrid.create({
  container: "#my-grid",
  info: "data_info",
  columns: [
    {id: "uid", name: "Data ID", width: 40, field: "uid"},
    {id: "name", name: "Data name", width: 400, field: "name"}
  ]
});
```

## Development

Hgrid depends on [NodeJS](http://nodejs.org/) for package management and [Grunt](http://gruntjs.com/) for automation.

### Getting started 

To install all dependencies needed for development, run

    $ npm install

in the project root's root directory.

### Testing

#### Running Tests

Install phantomjs to run tests without having to open a browser:

    $ npm install -g phantomjs

Run tests with grunt.

    $ grunt

#### Writing Tests

Tests are written using the [Qunit](http://qunitjs.com/) framework.

Tests are located in `tests/test-grid.js`.

Example:

```js
test("Data Length in Grid", function(){
    equal( myGrid.data.length, data.length);
});
```

#### Continuous Integration

Hgrid uses [Travis-CI](http://travis-ci.org) for continuous integration. Travis will call the `copy` and `qunit` tasks each time a pull request is created.

