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

## Creating the Grid

Creating the grid requires three things: the data, the column specifications, and the DIV to display the data.

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

## Loading Data from a Server

You can load a JSON array from a server by defining the `ajaxSource` property. The `ajaxOnSuccess` callback will be called upon successfully initializing the grid. For example:

```js
var myGrid;
Hgrid.create({
    container: "#myGrid",
    ajaxSource: "/files/",
    ajaxOnSuccess: function(grid) {
        myGrid = grid; // The initialized grid;
    },
    breadCrumbBox: "#breadCrumbs",
    url: "/upload/"
});
```

### Lazy-loading Data

By default, Hgrid will load and render all data retrieved from the server upon initialization. This can take a long time for large datasets. You may see significant speed improvements by "lazy-loading" the data.

If the `lazyLoad` option is set to `true`, a folder's contents will only be fetched from the server the first time its expand button is clicked.

Example:

```js
Hgrid.create({
    container: "#myGrid",
    ajaxSource: "/files/", lazyLoad: true,
    breadCrumbBox: "#breadCrumbs",
    url: "/upload/"
});
```

By default, the URL used to fetch a folder's contents will be its UID appended to `ajaxSource`, e.g. `/files/3` for a folder item with UID `3`.

You can change the URL scheme by defining the `itemUrl` function, which is passed the root url (`ajaxSource`) and the `item` object.

Example:

```js
Hgrid.create({
    container: "#myGrid",
    ajaxSource: "/files/", lazyLoad: true,
    itemUrl: function(ajaxSource, item) {
        return ajaxSource + item.name;
    }
    breadCrumbBox: "#breadCrumbs",
    url: "/upload/"
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

Tests are written using the [QUnit](http://qunitjs.com/) framework.

Tests are located in `tests/test-grid.js`.

Example:

```js
test("Data Length in Grid", function(){
    equal( myGrid.data.length, data.length);
});
```

#### Continuous Integration

Hgrid uses [Travis-CI](http://travis-ci.org) for continuous integration. Travis will call the `copy` and `qunit` tasks each time a pull request is created.

