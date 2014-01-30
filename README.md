# HGrid.js

*Full documentation to come*

## Quickstart

1. Include jQuery:

  ```html
  <script src="//code.jquery.com/jquery-1.10.2.js"></script>
  ```

2. Include HGrid:

  ```html
  <link rel="stylesheet" href="dist/hgrid.css" type="text/css" />
  ```

  ```html
  <script src="dist/hgrid.min.js"></script>
  ```

  NOTE: Makes sure the `images` directory is in the same directory as `hgrid.css`

3. Create a new grid:

  ```javascript
  var files = {
    data: [
      {name: 'Documents', kind: 'folder', 
      children: [
        {name: 'mydoc.txt', kind: 'file'},
      ]},
      {name: 'Music', kind: 'folder',
      children: [
        {name: 'psycho-killer.mp3', kind: 'file'}
      ]}
    ]
  };
  var myGrid = new HGrid('#myGrid', {data: files});
  ```

## Columns 

### Using Predefined Column Schemas

HGrid comes with a few predefined column schemas.

- `HGrid.Columns.Name`: Included by default. Formats files and folders with proper indent, icon, and `name` field.
- `HGrid.Columns.ActionButtons`: Provides "Download" and "Delete" buttons for files and "Upload" button for folders.

Usage:

```javascript
var grid = new HGrid('#myGrid', {
  columns: [HGrid.Columns.Name,
            HGrid.Columns.ActionButtons]
  ...
});
```

### Modifying Predefined Column Schemas 

```javascript
// Customize the column header text
HGrid.Columns.Name.name = "Item Name"
var grid = new HGrid('#myGrid', {
  columns: [HGrid.Columns.Name]
});
```

### Custom Column Schemas

Columns are defined by objects that have--at a minimum--`id`, `name`, `renderFolder`, and `renderFile` properties.

`renderFolder` and `renderFile` are functions that return the HTML for a given folder or file, respectively.

```javascript
var nameColumn = {id: 'name', name: 'Name', 
  // receives `row` containing all the item information
  renderFolder: function(row) { 
    return '<div class="folder">' + row.name + "</div>";
  },
  renderFile: function(row) {
    return '<div class="file">' + row.name + "</div>";
  },
  sortable: true,
};

var filesizeColumn = {id: 'size', name: 'Filesize',
  renderFolder: function(row) {return '';} // Folders don't have a file size
  renderFile: function(row) {return row.filesize.toString(); },
  sortable: true,
  comparator: function(val1, val2) {...}
};

var grid = new HGrid('#myGrid', {
  columns: [nameColumn, filesizeColumn],
  ...
}); 
```

NOTE: Column schemas can additionally take any [Slickgrid column options](https://github.com/mleibman/SlickGrid/wiki/Column-Options).

#### Formatting helpers

The `HGrid.Format` namespace includes a number of functions for rendering a row's HTML.

For example, `HGrid.Format.withIndent` adds a span element with a width based on an item's `depth` property.

```javascript
var item = {id: 123, name: 'My Documents', kind: 'folder', depth: 3};

var nameColumn = {id: 'name', name: 'Name',
  renderFolder: function(row) {
    var itemHtml = '<em>' + row.name + '</em>';
    var itemWithIndent = HGrid.Format.withIndent(row, itemHtml);
    // => '<span class="hg-indent" style="width:45"></span><em>My Documents</em>'
    return itemWithIndent;
  },
  renderFile: ...
};
```

Available helpers

- `HGrid.Format.withIndent(row, html, [indentWidth])`: Adds an indenting span based on the a row's `depth` property.
- `HGrid.Format.asItem(row, html)`: Surrounds `html` with `<div class="hg-item" data-id=123>`
- `HGrid.Format.button(row, buttonDef)`: Render a button. TODO
- `HGrid.Format.buttons(row, buttonDefs)`: Render a series of buttons.  TODO


## Buttons and Actions 

TODO 

## File management

HGrid exposes a number of options and callbacks to allow uploading data as well as removing data.

Example:

```javascript
var grid = new HGrid('#myGrid', {
  data: files, 
  uploads: true,
  maxFilesize: 10,  // MB
  // Mimetypes or file extensions
  acceptedFiles: ['image/*', 'application/pdf', '.py'],
  uploadMethod: function(folder) {
    return item.uploadMethod || 'post';
  },
  // Returns where to send request for upload
  uploadUrl: function(folder) {  // {id: 3, name: 'My bucket', kind: 'folder'}
    return 'files/' + item.id;
  },
  // Returns where to send request for deletion
  deleteUrl: function(item) {
    return 'files/' + item.id + '/remove';
  },
  deleteMethod: 'delete', 
  downloadUrl: function(item) {
    return 'download/' + item.name;
  },
  // Check if a file is ok to upload
  // done is a callback that takes an error msg
  // if no msg, then accept the file
  uploadAccept: function(file, folder, done){
    if (file.name === 'justinbieber.jpg') {
      done('nope');
    } else{
      done();
    }
  },
  uploadAdded: function(file, newItem){},
  uploadSuccess: function(file, newItem){},
  uploadError: function(file, message, newItem) {},
  uploadProcessing: function(file, newItem) {},
  uploadProgress: function(file, progress, bytesSent, newItem) {}
});
```


#### Event Callbacks 

- `onClick: function(event, element, item)`: Called when grid is clicked. By default, toggles the collapsed state of `item`.
- `onAdd: function(item, grid)`
- `onDragover: function(event, item)`
- `onDragenter: function(event, item)`
- `onItemAdded: function(item)`: Called whenever a new row is added to the grid.


### Adding other listeners

The `init` option is useful for attaching additional listeners to the grid.

```javascript
var grid = new HGrid('#myGrid', {
  data: files,
  init: function() {
    this.element.on('mycustomevent', function(event) {alert('custom event triggered')});
  }
});
```

You can also pass in a `listeners` array.

```javascript
var grid = new HGrid('#myGrid', {
  listeners: [{selector: '.my-button', on: 'click', 
              callback: function(evt, row) {alert('Clicked on' + row.name); }}
              ]
});
```

### Overriding Slickgrid or Dropzone options

```javascript
var grid = new HGrid('#myGrid', {
  data: files,
  dropzoneOptions: {
    parallelUploads: 5
  },
  slickgridOptions: {
    editable: true
  }
});
```

### Other Options

- `width`: The width of the grid in px
- `height`: The height of the grid in px or "auto".
- `cssClass`: CSS class to apply to the grid. Can also be an array of classes. By default, the `"hgrid"` class will be added to the element.
- `indent`: Width to indent items in px. Defaults to 15px.
- `highlightClass`: Class added to a row when a row is highlighted. Defaults to `hg-row-highlight`.

TODO

## Styling the Grid

Default CSS Classes

- `hgrid`
- `hg-item`: Includes an item's indent spacer element, icon, and name
- `hg-folder`
- `hg-file`
- `hg-toggle`
- `hg-expand`
- `hg-collapse`
- `hg-row-highlight`
- `hg-upload-processing`
- `hg-upload-started`: Added to a row after a file is added and upload has started
- `hg-upload-error`: Added to a row if an error occurs during upload.


## Accessing SlickGrid and DropZone objects directly

```
myGrid.grid // => The Slick.Grid object 
myGrid.dropzone  // => The Dropzone object
```

## Dependencies

- [jQuery](http://jquery.com/)
- [[DropZone]](http://www.dropzonejs.com/) (if uploads are enabled)

Certain modules of [SlickGrid](https://github.com/mleibman/SlickGrid/wiki) are bundled with HGrid internally.

## Development

Hgrid depends on [NodeJS](http://nodejs.org/) for package management and [Grunt](http://gruntjs.com/) for automation.

### Getting started 

To install all development dependencies needed for development, run

    $ npm install

in the project root's root directory.

### Tests

Run tests with grunt.

    $ grunt

Tests are written using the [QUnit](http://qunitjs.com/) framework.

Tests are located in `tests/tests.js`.






