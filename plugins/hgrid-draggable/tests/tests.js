(function($) {
  'use strict';


  // Fixtures and factories
  var counter = 0;

  function getMockItem(args) {
    var item = $.extend({}, {
      id: 123,
      name: 'test.txt',
      kind: HGrid.FOLDER,
      parentID: 'root',
      depth: 1,
      _node: new HGrid.Tree({
        name: 'test.txt',
        kind: HGrid.Folder
      })
    }, args);
    return item;
  }
  var testData = {
    data: [{
      name: 'Documents',
      kind: HGrid.FOLDER,
      children: [{
        name: 'Scripts',
        kind: HGrid.FOLDER,
        children: [{
          name: 'foo.py',
          kind: HGrid.ITEM
        }]
      }, {
        name: 'mydoc.txt',
        kind: HGrid.ITEM
      }]
    }, {
      name: 'Music',
      kind: HGrid.FOLDER,
      children: [{
        name: 'bar.mp3',
        kind: HGrid.FOLDER
      }]
    }]
  }
  var myGrid;

  function getMockGrid(args) {
    var options = $.extend({}, {
      data: testData
    }, args);
    var grid = new HGrid('#myGrid', options);
    return grid;
  }


  ////////////////////
  // Custom asserts //
  ////////////////////
  function isTrue(expr, msg) {
    return strictEqual(expr, true, msg || 'is true');
  }

  function isFalse(expr, msg) {
    return strictEqual(expr, false, msg || 'is false');
  }

  /**
   * Checks if the selected element contains given text
   */
  function containsText(selector, text, msg) {
    var fullSelector = selector + ':contains(' + text + ')';
    return isTrue($(fullSelector).length > 0, msg || '"' + text + '" found in element(s)');
  }

  /**
   * Checks if the selected element does not contain given text
   */
  function notContainsText(selector, text, msg) {
    var fullSelector = selector + ':contains(' + text + ')';
    return equal($(fullSelector).length, 0, msg || '"' + text + '" found in element(s)');
  }

  module('Basic', {
    setup: function() {
      myGrid = getMockGrid();
    },
    teardown: function() {
      myGrid.destroy();
      HGrid.Tree.resetIDCounter();
    }
  });

  test('Basic instantiation and registration', function() {
    var draggable = new HGrid.plugins.Draggable();
    myGrid.registerPlugin(draggable);

    isTrue(myGrid.plugins.find(draggable) > 0);
  });

})(jQuery);
