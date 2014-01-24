# HGrid.js

## Demo

TODO

## Usage

1. Include jQuery:

  ```html
  <script src="//code.jquery.com/jquery-1.10.2.js"></script>
  ```

2. Include hgrid.js:

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

### Testing

#### Running Tests

Run tests with grunt.

    $ grunt

#### Writing Tests

Tests are written using the [QUnit](http://qunitjs.com/) framework.

Tests are located in `tests/tests.js`.

Example:

```js
test("Data Length in Grid", function(){
    equal( myGrid.data.length, data.length);
});
```




