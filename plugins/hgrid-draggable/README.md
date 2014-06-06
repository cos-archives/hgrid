# hgrid-draggable.js (experimental)

Drag-and-drop support for hgrid.js.

## Dependencies

- jQuery
- HGrid >= 0.1.1

## Usage 

```html
<script src="hgrid.js"></script>
<script type="hgrid-draggable.js"></script>
```

```js
var draggable = new HGrid.Draggable({
  onDrag: function(event, items) {
    # ... 
  },
  onDrop: function(event, items, folder) {
    # ...
  }
  canDrag: function(item) {
    if (item.name === "Don't drag me") {
        return false;
    }
    return true;
  }
});

var grid = new HGrid({
    # ...
})
grid.registerPlugin(draggable);

```


## Available Options

- `onDrag(event, items)`: Fired while items are being dragged
- `onDrop(event, items, folder)`: Fired when items are dropped into a folder.
- `canDrag(item)`: Returns whether an item can be dragged.
- `rowMoveManagerOptions`: Additional options passed to the `Slick.RowMoveManager` constructor


## TODO

- Fix drop position
- Make folders draggable
- Multiple selection


## Development

Requirements

- NodeJS
- Bower

```sh
$ npm install  # installs gulp + gulp plugins
$ bower install  # installs dependencies (e.g. HGrid, qUnit...)
```


### Running tests

Tests are run using the `gulp` build tool.

```sh
$ gulp
```

You can also start watch mode

```sh
$ gulp watch
```


