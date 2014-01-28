# HGrid.js

## Demo

TODO

## Usage

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

### File management

HGrid exposes a number of options and callbacks to allow uploading data as well as removing data.

Example:

```javascript
var grid = new HGrid('#myGrid', {
  data: files, 
  uploads: true,
  maxFilesize: 10,  // MB
  // Mimetypes or file extensions
  acceptedFiles: ['image/*', 'application/pdf', '.py'],
  uploadMethod: function(item) {
    return item.uploadMethod || 'post';
  },
  // Returns where to send request for upload
  uploadUrl: function(item) {  // {id: 3, name: 'My bucket', kind: 'folder'}
    return 'files/' + item.id;
  },
  uploadParams: {}  // TODO
  // Returns where to send request for deletion
  deleteUrl: function(item) {
    return 'files/' + item.id + '/remove';
  },
  deleteMethod: 'delete',  // TODO
  deleteParams: {}, // TODO
  downloadUrl: function(item) { // TODO
    return 'download/' + item.name;
  },
  // Check if a file is ok to upload
  // done is a callback that takes an error msg
  // if no msg, then accept the file
  uploadAccept: function(file, folder, done){ // TODO
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

## Adding buttons 

Predefined actions:

- `download`
- `upload`: Opens filepicker to upload to a folder
- `delete`: Sends request to delete a file

```javascript
var grid = new HGrid('#myGrid', {
  data: myData,
  folderButtons: function(folder) {
    return [
      {template: 'Upload', action: 'upload'}
    ]
  },
  fileButtons: function(file) {
    return [
      {template: 'Download', action: 'download'},
      {template: 'Delete', action: 'delete'},
      {template: '<a class="btn" href="http://www.example.com/">Custom button</a>'}
    ];
  }
});
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

#### Callbacks 

- `onClick: function(event, element, item)`: Called when grid is clicked. By default, toggles the collapsed state of `item`.
- `onAdd: function(item, grid)`
- `onDragover: function(event, item)`
- `onDragenter: function(event, item)`
- `onItemAdded: function(item)`: Called whenever a new row is added to the grid.

*Full documentation to come*

## Styling the Grid

CSS Classes

- `hgrid`
- `hg-item`: Includes an item's indent spacer element, icon, and name
- `hg-folder`
- `hg-file`
- `hg-row-highlight`
- `hg-upload-started`: Added to a row after a file is added and upload has started
- `hg-upload-error`: Added to a row if an error occurs during upload.

### Rendering File and Folder HTML

TODO: document `renderFile(item)` and `renderFolder(item)` options

## Modifying default columns

```
// Modifying the `Name` column header text
HGrid.COL_NAME.name = 'Name of file'
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






