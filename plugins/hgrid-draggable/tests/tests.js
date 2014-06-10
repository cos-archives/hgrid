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
  };
  var myGrid;

  function getMockGrid(args) {
    var options = $.extend({}, {
      data: testData
    }, args);
    var grid = new HGrid('#myGrid', options);
    return grid;
  }


  //////////////////////////////////
  // Custom asserts and utilities //
  //////////////////////////////////
  function isTrue(expr, msg) {
    return strictEqual(expr, true, msg || 'is true');
  }

  function isFalse(expr, msg) {
    return strictEqual(expr, false, msg || 'is false');
  }

  /** Trigger a Slick.Event **/
  function triggerSlick(evt, args, e) {
    e = e || new Slick.EventData();
    args = args || {};
    args.grid = self;
    return evt.notify(args, e, self);
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
    var draggable = new HGrid.Draggable();
    myGrid.registerPlugin(draggable);
    // $.inArray returns index of the passed in value, or -1 if not found
    isTrue($.inArray(draggable, myGrid.plugins) >= 0);
    equal(draggable.grid, myGrid, 'plugin has access to the grid');
  });

  var draggable; // Draggable plugin
  var onDragSpy, onDropSpy, acceptDropSpy, canDragSpy;
  module('Callbacks', {
    setup: function() {
      myGrid = getMockGrid();
      // Create spies to record invocations of the callbacks
      onDragSpy = sinon.spy();
      onDropSpy = sinon.spy();
      acceptDropSpy = sinon.spy();
      canDragSpy = sinon.spy();
      draggable = new HGrid.Draggable({
        onDrag: onDragSpy,
        onDrop: onDropSpy,
        acceptDrop: acceptDropSpy,
        canDrag: canDragSpy
      });
      myGrid.registerPlugin(draggable);
    },
    teardown: function() {
      myGrid.unregisterPlugin(draggable);
      myGrid.destroy();
    }
  });

  test('onDrag callback is invoked upon dragging rows', function() {
    var item = myGrid.getData()[0];
    // trigger the rowmovemanger's onDragRows event
    triggerSlick(draggable.rowMoveManager.onDragRows, {
      items: [item],
      insertBefore: 1
    });
    isTrue(onDragSpy.calledOnce, 'onDrag was called');
    deepEqual(onDragSpy.args[0][1], [item], 'second argument is the array of dragged items');
  });

  test('onDrop is invoked upon dropping rows', function() {
    // folder target must be set before onMoveRows is triggered
    var folder = myGrid.getData()[0];
    draggable.setTarget(folder);
    // trigger the rowmovemanageer's onMoveRows event
    var item = myGrid.getData()[1];
    triggerSlick(draggable.rowMoveManager.onMoveRows, {
      rows: [1, 3],
      items: [item]
    });
    isTrue(onDropSpy.calledOnce, 'onDrop was called');
    deepEqual(onDropSpy.args[0][1], [item], 'second argument is the array of dropped items');
    deepEqual(onDropSpy.args[0][2], folder, 'third argument is the folder that was dragged to');
  });

  test('acceptDrop is called for every moved row', function() {
    // folder target must be set before onMoveRows is triggered
    var folder = myGrid.getData()[0];
    draggable.setTarget(folder);
    // trigger the rowmovemanageer's onMoveRows event
    var itemsToMove = myGrid.getData().slice(1, 3);
    triggerSlick(draggable.rowMoveManager.onMoveRows, {
      rows: [1, 2],
      items: itemsToMove
    });
    equal(acceptDropSpy.callCount, itemsToMove.length, 'acceptDrop called for every moved item');
  });


})(jQuery);
