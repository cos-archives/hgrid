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
        {name: 'mydoc.txt', kind: 'item'},
      ]},
      {name: 'Music', kind: 'folder',
      children: [
        {name: 'psycho-killer.mp3', kind: 'item'}
      ]}
    ]
  };
  var myGrid = new HGrid('#myGrid', {data: files});
  ```

## Rows and Columns 

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
HGrid.Columns.Name.text = "Item Name"
var grid = new HGrid('#myGrid', {
  columns: [HGrid.Columns.Name]
});
```

### Custom Column Schemas, Sorting

Column schemas are just objects that have--at a minimum--the following properties:

- `text`: The text to show in the column header
- `folderView`: Either a function that renders the HTML for a folder or a microtemplate.
- `itemView`: Either a function that render the HTML for a file or a microtemplate.

To make a column sortable, provide `sortable=true` and a `sortkey` on which to sort the data.

NOTE: Column schemas can additionally take any [Slickgrid column options](https://github.com/mleibman/SlickGrid/wiki/Column-Options).

Examples: 

```javascript
// Custom column schemas
var myCustomNameColumn = {
  text: 'Name', 
  folderView: '<div class="folder {{cssClass}}">{{ name }}</div?>' // Using a microtemplate
  itemView: '<div class="file {{cssClass}}">{{ name }}</div?>'
  sortable: true,
  sortkey: 'name' // property of item object on which to sort on
};

var filesizeColumn = {text: 'Filesize',
  // receives `row` containing all the item information
  itemView: function(row) {return row.filesize.toString(); },
  folderView: function(row) {return '';} // Folders don't have a file size
  sortable: true, sortkey: 'size'
};

var grid = new HGrid('#myGrid', {
  columns: [myCustomNameColumn, filesizeColumn],
  ...
}); 
```

#### Formatting helpers

The `HGrid.Format` namespace includes a number of functions for rendering a row's HTML.

For example, `HGrid.Format.withIndent` adds a span element with a width based on an item's `depth` property.

```javascript
var item = {id: 123, name: 'My Documents', kind: 'folder', depth: 3};

var nameColumn = {text: 'Name',
  folderView: function(row) {
    var html = HGrid.Format.tpl('<em>{{ name }}</em?>', row);
    var itemWithIndent = HGrid.Format.withIndent(row, html);
    // => '<span class="hg-indent" style="width:45"></span><em>My Documents</em>'
    return itemWithIndent;
  },
  itemView: ...
};
```

Available helpers

- `HGrid.Format.withIndent(row, html, [indentWidth])`: Adds an indenting span based on the a row's `depth` property.
- `HGrid.Format.asItem(row, html)`: Surrounds `html` with `<div class="hg-item" data-id=123>`
- `HGrid.Format.button(row, buttonDef)`: Render a button.
- `HGrid.Format.buttons(row, buttonDefs)`: Render a series of buttons.
- `HGrid.Format.tpl(template, data)`: Microtemplating function.


## Actions 

TODO 

## File management

```javascript
var grid = new HGrid('#myGrid', {
  data: files, 
  uploads: true,
  columns: [HGrid.Columns.Name, 
            HGrid.Columns.ActionButtons]  // Provides file-related buttons
                                          // (Upload, Download, Delete)
  maxFilesize: 10,  // MB
  // Mimetypes or file extensions
  acceptedFiles: ['image/*', 'application/pdf', '.py'],
  uploadMethod: function(row) {
    return row.uploadMethod || 'post';
  },
  // Can be a string or a function that returns where to send request for upload
  uploadUrl: function(row) {  // row => {id: 3, name: 'My bucket', kind: 'folder'}
    return 'files/' + row.id;
  },
  // Returns where to send request for deletion
  deleteUrl: function(row) {
    return 'files/' + row.id + '/remove';
  },
  deleteMethod: 'delete', 
  downloadUrl: function(row) {
    return 'download/' + row.name;
  }
});
```


## Callback Options

### Event Callbacks

- `onClick: function(event, element, item)`: Called when grid item is clicked. By default, toggles the collapsed state of `item`.
- `onAdd: function(item, grid)`
- `onDragover: function(event, item)`
- `onDragenter: function(event, item)`
- `onDragleave: function(event, item)`
- `onDrop: function(event, item)`
- `onSort: function(event, column, args)`: Called whenever a column header is clicked to sort the grid.

### Upload-related Callbacks 

- `uploadAdded: function(file, item)`
- `uploadProcessing function(file, item)`: Called when a file in the upload queue begins processing.
- `uploadError: function(file, message, item)`: Called when a file upload fails. By default, imputes the error message into any HTML element that has the `data-upload-errormessage` attribute.
- `uploadProgress: function(file, progress, bytesSent, item)`: Called whenever upload progress changes.
- `uploadSuccess: function(file, item)`
- `uploadComplete: function(file, item)`
- `uploadAccept: function(file, folder, done)`: Validation function that is run before a file gets uploaded. `done` is a function that, if called with a string argument, raises the error message, passes it to `uploadError`, and terminates the upload. If called with no arguments, the upload is allowed. For filetype and filesize checking, use the `acceptedFiles` and `maxFilesize` options.

  ```javascript
  uploadAccept: function(file, folder, done) {
    if (file.name === 'muggle.jpg')
      done('No muggles allowed');
    done();
  }
  ```

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


### Other Options

- `width`: The width of the grid in px
- `height`: The height of the grid in px or "auto".
- `cssClass`: CSS class to apply to the grid. Can also be an array of classes. By default, the `"hgrid"` class will be added to the element.
- `indent`: Width to indent items in px. Defaults to 15px.

TODO

## Styling the Grid

Default CSS Classes

- `hgrid`
- `hg-item`: Includes an item's indent spacer element, icon, and name
- `hg-btn`
- `hg-folder`
- `hg-file`: Used in `HGrid.Columns.Name` to render the file icon.
- `hg-toggle`: Used in `HGrid.Columns.Name` column to make an item toggle-able
- `hg-expand`
- `hg-collapse`
- `hg-row-highlight`
- `hg-row-highlight`
- `hg-upload-processing`
- `hg-upload-started`: Added to a row after a file is added and upload has started
- `hg-upload-error`: Added to a row if an error occurs during upload.


### Overriding Slickgrid or Dropzone options

You can pass initial options to the Slickgrid or Dropzone constructors like so:

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
