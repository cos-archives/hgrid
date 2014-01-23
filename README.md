# HGrid.js

## Demo

TODO

## Usage

1. Include jQuery:

  ```html
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
  ```

2. Include hgrid.js:

  ```html
  <link rel="stylesheet" href="dist/hgrid.css" type="text/css" />
  ```

  ```html
  <script src="dist/hgrid.min.js"></script>
  ```

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


### Available Options

- `width`: The width of the grid in px
- `height`: The height of the grid in px or "auto".
- `cssClass`: CSS class to apply to the grid. Can also be an array of classes. By default, the `"hgrid"` class will be added to the element.
- `indent`: Width to indent items in px.

TODO

#### Callbacks 

- `onClickItem: function(event, element, item, grid)`
- `onAdd: function(item, grid)`

*Full documentation to come*



