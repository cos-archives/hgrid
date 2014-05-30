# hgrid-draggable.js

Drag-and-drop support for hgrid.js.

## Usage 

```html
<script src="hgrid.js"></script>
<script type="hgrid-draggable.js"></script>
```

```js
var draggable = new HGrid.plugins.Draggable({
    # ... config
});

HGrid.registerPlugin(draggable);

var grid = new HGrid({

    onDragStart: function(event, source, target) {
        #...
    },

})

```

## TODO and notes

Event callbacks that receive `(event, source, destination)`

- onDrop
- onDragStart
- onDragEnd
- onDragEnter
- onDrag
- onDragLeave


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


