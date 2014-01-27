(function($) {
  'use strict';

  $.mockjaxSettings.responseTime = 0; // Speed up tests

  var counter = 0;

  function getMockFile() {
    return {
      name: 'test file ' + counter++,
      size: 123456,
      type: 'text/html'
    };
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

  function areIdentical(x, y, msg) {
    return ok(x == y, msg || (x + ' and ' + y + ' are identical'));
  }
  var testData = {
    data: [{
      name: 'Documents',
      kind: 'folder',
      children: [{
        name: 'Scripts',
        kind: 'folder',
        children: [{
          name: 'foo.py',
          kind: 'file'
        }]
      }, {
        name: 'mydoc.txt',
        kind: 'file'
      }]
    }, {
      name: 'Music',
      kind: 'folder',
      children: [{
        name: 'bar.mp3',
        kind: 'folder'
      }]
    }]
  },
    myGrid;
  module('Basic', {
    setup: function() {
      myGrid = new HGrid('#myGrid', {
        data: testData,
      });
    },
    teardown: function() {
      myGrid.destroy();
      HGrid.Tree.resetIDCounter();
    }
  });

  test('Instantiation', function() {
    var grid2 = new HGrid('#myGrid', {
      data: testData
    });
    ok(grid2, 'standard initialization');

    throws(function() {
      new HGrid('#myGrid', {
        ajaxSource: '/foo/',
        data: testData
      });
    }, HGridError, 'fails if both ajax url and data are passed to constructor');
  });

  test('Initializing HGrid with data that has metadata', function() {
    var items = {
      data: [{
        name: 'foo.py',
        kind: 'file',
        lang: 'python'
      }, {
        name: 'bar.js',
        kind: 'file',
        lang: 'javascript'
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: items
    });
    equal(grid.getData()[0].lang, 'python', 'can get lang');
    equal(grid.getData()[1].lang, 'javascript', 'can get lang');
  });

  test('Initializing grid, overriding `id` property', function() {
    var items = {
      data: [{
        name: 'foo.py',
        kind: 'file',
        id: 'file1'
      }, {
        name: 'bar.js',
        kind: 'file',
        id: 'file2'
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: items
    });
    var foo = grid.getByID('file1');
    equal(foo.name, 'foo.py', 'retrieved correct item');
  });

  test('CSS', function() {
    var grid = new HGrid('#myGrid', {
      data: testData
    });
    isTrue(grid.element.hasClass('hgrid'), 'container class defaults to "hgrid"');
    grid.destroy();
    var another = new HGrid('#myGrid', {
      data: testData,
      cssClass: 'my-hgrid'
    });
    isTrue(grid.element.hasClass('my-hgrid'), 'user-specified css class');
    another.destroy();
    var classes = ['my-hgrid', 'my-table'];
    var multiClassGrid = new HGrid('#myGrid', {
      data: testData,
      cssClass: classes
    });
    // Check that the element has each class
    classes.forEach(function(cls) {
      isTrue(multiClassGrid.element.hasClass(cls));
    });
  });

  test('Default columns', function() {
    var grid = new HGrid('#myGrid');
    var cols = grid.grid.getColumns();
    equal(cols[0].name, 'Name');
    equal(cols[0].id, 'name');
    containsText('.slick-header', 'Name', 'name column is in DOM');
  });

  test('Options and attributes', function() {
    // passed in options
    deepEqual(myGrid.options.data, testData);
    // Default options
    deepEqual(myGrid.options.slickGridOptions, myGrid._defaults.slickGridOptions);
    equal(myGrid.options.navLevel, null);
    deepEqual(myGrid.options.columns, myGrid._defaults.columns, 'default columns are used');
    // Attributes
    ok(myGrid.element instanceof jQuery, 'myGrid.element is a jQuery element');
    ok(myGrid.grid instanceof Slick.Grid, 'has a SlickGrid object');
    ok(myGrid.tree instanceof HGrid.Tree, 'has a HGrid.Tree');
  });

  test('Getting data', function() {
    deepEqual(myGrid.getData(), myGrid.grid.getData().getItems(), 'with the getData() convenience method');
  });

  test('DataView', function() {
    var dataViewItems = myGrid.grid.getData().getItems();
    equal(dataViewItems.length, myGrid.tree.toData().length,
      'has length that is the same as the HGrid.Tree length');
    var dataView = myGrid.getDataView();
    equal(dataView, myGrid.grid.getData(), 'is accessible via getDataView() method');
  });

  test('Getting items', function() {
    var item = myGrid.getByID(1);
    equal(item, myGrid.grid.getData().getItemById(1));
  });

  test('Adding item', function() {
    var oldDataLength = myGrid.getData().length;
    var parentItem = myGrid.getData()[0];
    var newItem = {
      parentID: parentItem.id,
      name: 'New folder',
      kind: 'folder'
    };

    var addedItem = myGrid.addItem(newItem); // Returns the added item
    var newLength = myGrid.getData().length;
    equal(newLength, oldDataLength + 1, 'increases the length of the data by 1');
    equal(addedItem.id, HGrid.Tree._getCurrentID() - 1, 'id is unique');
    equal(addedItem.parentID, parentItem.id, 'parentID is correct');
    equal(addedItem.depth, parentItem.depth + 1, 'new item has a depth 1 greater than its parent');
    containsText('.slick-cell', newItem.name, 'Item added to DOM');
    var tree = myGrid.getNodeByID(addedItem.id);
    ok(tree instanceof HGrid.Tree, 'tree node was added');
  });

  test('Adding column', function() {
    myGrid.addColumn({
      id: 'mycol',
      name: 'Testing column'
    });
    containsText('.slick-header', 'Testing column', 'new column was added in the DOM');
  });

  test('Removing item', function() {
    // Remove the last item in the dataset
    var allData = myGrid.getData();
    var oldLength = allData.length;
    var item = allData[allData.length - 1];
    // DOM contains the element to begin with
    containsText('.slick-cell', item.name, 'DOM contains element to be removed');
    var removedItem = myGrid.removeItem(item.id);
    var newLength = myGrid.getData().length;
    equal(newLength, oldLength - 1, 'decreases the length of the data by 1');
    equal(removedItem.id, item.id, 'removes the correct datum');
    notContainsText('.slick-cell', item.name, 'removes the element from the DOM');
  });

  test('getRowElement()', function() {
    var item = myGrid.getData()[0];
    var $elem = $(myGrid.getRowElement(item.id));
    isTrue($elem.hasClass('slick-row'), 'is a SlickGrid row');
    equal($elem.find('.hg-item').attr('data-id'), item.id.toString(), 'is the row for the correct item');
  });

  test('Expanding item', function() {
    var dat = {
      data: [{
        kind: 'folder',
        name: 'Docs',
        children: [{
          kind: 'file',
          name: 'mydoc.txt'
        }]
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: dat
    });
    var folder = grid.getData()[0];
    grid.collapseItem(folder); // Start with collapsed
    notContainsText('.slick-cell', 'mydoc.txt');
    grid.expandItem(folder);
    isFalse(grid.isCollapsed(folder));
    containsText('.slick-cell', 'mydoc.txt', 'shows folder contents in DOM');
  });

  test('Toggle collapse', function() {
    var dat = {
      data: [{
        kind: 'folder',
        name: 'Docs',
        children: [{
          kind: 'file',
          name: 'mydoc.txt'
        }]
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: dat
    });
    var folder = grid.getData()[0];
    containsText('.slick-cell', 'mydoc.txt');
    grid.toggleCollapse(folder);
    notContainsText('.slick-cell', 'mydoc.txt');
    grid.toggleCollapse(folder);
    isFalse(grid.isCollapsed(folder));
  });

  test('Collapse filter', function() {
    var myData = {
      data: [{
        name: 'Parent',
        kind: 'folder',
        children: [{
          name: 'Child',
          kind: 'file'
        }]
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: myData
    });
    var parent = grid.getData()[0];
    parent._collapsed = false;
    var child = grid.getData()[1];
    isTrue(grid._collapseFilter(child, {
      thisObj: grid,
      rootID: 'root'
    }), 'returns true if parent is not collpased');
    parent._node.collapse();
    child = grid.getData()[1];
    isFalse(grid._collapseFilter(child, {
      thisObj: grid,
      rootID: 'root'
    }), 'returns false if parent is collapsed');
  });

  test('Adding item to a grid with no data', function() {
    var grid = new HGrid('#myGrid');
    var addedItem = grid.addItem({
      name: 'First',
      kind: 'folder'
    });
    containsText('.slick-cell', addedItem.name, 'Item added to DOM');
  });

  test('Getting a tree node by ID', function() {
    var item = myGrid.getData()[0];
    var tree = myGrid.getNodeByID(item.id);
    ok(tree instanceof HGrid.Tree, 'returns a HGrid.Tree');
    equal(tree.id, item.id, 'tree and item have same id');
    equal(tree.data.name, item.name, 'tree and item have same name');
  });

  test('Getting root node by ID', function() {
    var root = myGrid.getNodeByID(HGrid.ROOT_ID);
    ok(root instanceof HGrid.Tree, 'root is a tree');
    equal(root.id, HGrid.ROOT_ID, 'has root id');
  });

  module('Tree and leaf', {
    teardown: function() {
      HGrid.Tree.resetIDCounter();
    }
  });

  test('Tree and DataView', function() {
    var root = new HGrid.Tree();
    ok(root.dataView, 'root has a dataView attribute');
    var subtree = new HGrid.Tree('Docs', 'folder');
    root.add(subtree);
    areIdentical(root.dataView, subtree.dataView);
  });

  test('Creating Trees and Leaves', function() {
    var root = new HGrid.Tree();
    equal(root.id, 'root', 'root id is "root"');
    var tree1 = new HGrid.Tree({
      name: 'My Documents',
      kind: 'folder'
    });
    equal(tree1.id, 0);
    equal(tree1.data.kind, 'folder', 'sets the tree kind');
    var tree2 = new HGrid.Tree({
      name: 'My Music',
      kind: 'folder'
    });
    equal(tree2.id, 1);
    var leaf1 = new HGrid.Leaf({
      name: 'foo.py',
      kind: 'file'
    });
    equal(leaf1.id, 2);
    equal(leaf1.data.kind, 'file', 'sets the leaf kind');
  });


  test('Added tree and leaf point to same dataview', function() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER
    });
    var leaf = new HGrid.Leaf({
      name: 'myfile.txt',
      kind: HGrid.FILE
    });
    tree.add(leaf); // NOTE: nodes are added out of hierarchical order
    root.add(tree);
    root.updateDataView();
    equal(root.dataView, tree.dataView, 'root and tree point to same dataview');
    equal(tree.dataView, leaf.dataView, 'tree and leaf point to same dataview');
  });

  test('Tree.getItem()', function() {
    var root = new HGrid.Tree();
    equal(root.getItem(), undefined, 'root does not have an item');
    var folder = new HGrid.Tree({
      name: 'Folder 1',
      kind: 'folder'
    });
    root.add(folder);
    root.updateDataView();
    var item = folder.getItem();
    equal(item.name, 'Folder 1');
    equal(item.parentID, HGrid.ROOT_ID);
    equal(item._node, folder);
  });

  test('Leaf.getItem()', function() {
    var root = new HGrid.Tree();
    var leaf = new HGrid.Leaf({
      name: 'file.txt',
      kind: 'file'
    });
    root.add(leaf);
    root.updateDataView();
    var leafItem = leaf.getItem();
    equal(leafItem.kind, 'file');
    equal(leafItem.parentID, HGrid.ROOT_ID);
  });

  test('Leaf.collapse()', function() {
    var root = new HGrid.Tree();
    var leaf = new HGrid.Leaf({
      name: 'doc.txt',
      kind: HGrid.FILE,
      _collapsed: false
    });
    root.add(leaf, true);
    var leafItem = leaf.getItem();
    isFalse(leafItem._collapsed, 'not collapsed');
    leaf.collapse();
    isTrue(leafItem._collapsed, 'collapses after calling collapse()');
  });

  test('Leaf.expand()', function() {
    var root = new HGrid.Tree();
    var leaf = new HGrid.Leaf({
      name: 'doc.txt',
      kind: HGrid.FILE,
      _collapsed: true
    });
    root.add(leaf, true);
    isTrue(leaf.getItem()._collapsed, 'collapsed to begin with');
    leaf.expand();
    isFalse(leaf.getItem()._collapsed, 'expanded');
  });

  test('Tree.collapse() including root', function() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER,
      _collapsed: false
    });
    var leaf = new HGrid.Leaf({
      name: 'mydoc.txt',
      kind: HGrid.FILE,
      _collapsed: false
    });
    root.add(tree, true);
    tree.add(leaf, true);
    var item = tree.getItem();
    isFalse(item._collapsed, 'not collapsed to begin with');
    isFalse(leaf.getItem()._collapsed, 'leaf is not collapsed to begin with');
    tree.collapse(true);
    isTrue(leaf.getItem()._collapsed, 'child leaf collapses after parent is collapsed');
    isTrue(leaf.getItem()._hidden, 'child leaf is hidden');
  });

  test('Tree.collapse() children only', function() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER,
      _collapsed: false
    });
    var leaf = new HGrid.Leaf({
      name: 'mydoc.txt',
      kind: HGrid.FILE,
      _collapsed: false
    });
    root.add(tree);
    tree.add(leaf);
    root.updateDataView();
    var item = tree.getItem();
    isFalse(item._collapsed, 'not collapsed to begin with');
    isFalse(leaf.getItem()._collapsed, 'leaf is not collapsed to begin with');
    tree.collapse(); // didn't pass first argument, so don't collpase the tree itself
    item = tree.getItem();
    isTrue(item._collapsed, 'item collapsed after calling its collapse() method');
    isFalse(item._hidden, 'item is visible after calling collapse()');
    isTrue(leaf.getItem()._collapsed, 'child leaf also collapses after parent is collapsed');
  })

  test('Tree.expand()', function() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER,
      _collapsed: true
    });
    var leaf = new HGrid.Leaf({
      name: 'mydoc.txt',
      kind: HGrid.FILE,
      _collapsed: true
    });
    root.add(tree, true);
    tree.add(leaf, true);
    var item = tree.getItem();
    isTrue(item._collapsed, 'collapsed to begin with');
    isTrue(leaf.getItem()._collapsed, 'leaf is collapsed to begin with');
    tree.expand();
    isFalse(item._collapsed, 'expanded after calling collapse()');
    isFalse(leaf.getItem()._collapsed, 'child leaf is expanded after parent is collapsed');
  });

  test('Tree.expand() maintains subtree collapsed state', function() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER,
    });
    var subtree = new HGrid.Tree({
      name: 'Scripts',
      kind: HGrid.FOLDER
    });
    root.add(tree, true);
    tree.add(subtree, true);
    subtree.collapse();
    tree.collapse();
    tree.expand();
    isFalse(tree.isCollapsed(), 'tree is expanded');
    isTrue(subtree.isCollapsed(), 'subtree is still collapsed');
  });

  test('Creating trees with metadata', function() {
    var t1 = HGrid.Tree({
      name: 'foo.py',
      kind: 'folder',
      language: 'python'
    });
    equal(t1.data.language, 'python');
    equal(t1.id, 0);
  })

  test('Depths', function() {
    var root = new HGrid.Tree();
    var subtree = new HGrid.Tree('Subtree', 'folder');
    var subsubtree = new HGrid.Tree('Another subtree', 'folder');
    var leaf = new HGrid.Leaf('Leaf', 'file');
    var rootLeaf = new HGrid.Leaf('Root leaf', 'file');
    root.add(subtree);
    root.add(rootLeaf);
    subtree.add(subsubtree);
    subsubtree.add(leaf);
    equal(root.depth, 0, 'root depth is 0');
    equal(subtree.depth, 1, 'subtree depth');
    equal(subsubtree.depth, 2);
    equal(rootLeaf.depth, 1);
  });

  test('Tree and leaf to Slick data', function() {
    var root = new HGrid.Tree();
    ok(root.depth === 0, 'Constructing HGrid.Tree with no args creates a root node');
    var tree = new HGrid.Tree({
      name: 'My Documents',
      kind: 'folder'
    });
    ok(tree.depth !== 0, 'A tree with a name and kind is not a root node.');
    root.add(tree);
    deepEqual(tree.toData(), [{
      id: tree.id,
      name: tree.data.name,
      kind: tree.data.kind,
      parentID: 'root',
      depth: tree.depth,
      _node: tree
    }]);
    // root is not included in data
    deepEqual(root.toData(), tree.toData(), 'root is excluded from data');
    var leaf = new HGrid.Leaf({
      name: 'foo.py',
      kind: 'file'
    });
    tree.add(leaf);
    deepEqual(leaf.toData(), {
      id: leaf.id,
      name: leaf.data.name,
      kind: leaf.data.kind,
      parentID: tree.id,
      depth: leaf.depth,
      _node: leaf
    }, 'Converting leaf to data');
    deepEqual(tree.toData(), [{
        id: tree.id,
        name: tree.data.name,
        kind: tree.data.kind,
        parentID: 'root',
        depth: tree.depth,
        _node: tree
      },
      leaf.toData()
    ], 'Converting tree to data');
  });

  test('Tree.toData() with metadata', function() {
    var tree = new HGrid.Tree({
      name: 'foo.py',
      kind: 'file',
      lang: 'python'
    });
    deepEqual(tree.toData(), [{
      id: tree.id,
      name: tree.data.name,
      kind: tree.data.kind,
      depth: tree.depth,
      parentID: null,
      _node: tree,
      lang: 'python'
    }]);
  })

  test('Constructing leaf from object', function() {
    var file = HGrid.Leaf.fromObject({
      name: 'foo.py',
      kind: 'file'
    });
    ok(file instanceof HGrid.Leaf, 'fromObject returns a HGrid.Leaf');
    equal(file.data.name, 'foo.py');
    equal(file.data.kind, 'file');
  });

  test('Constructing tree from object', function() {
    var data = [{
      name: 'Documents',
      kind: 'folder',
      children: [{
        name: 'mydoc.txt',
        kind: 'file'
      }, {
        name: 'Scripts',
        kind: 'folder',
        children: [{
          name: 'script.py',
          kind: 'file'
        }, {
          name: 'JS scripts',
          kind: 'folder',
          children: []
        }]
      }]
    }, {
      name: 'rootfile.js',
      kind: 'file'
    }];
    var root = HGrid.Tree.fromObject(data);
    root.updateDataView();
    equal(root.depth, 0, 'Root depth is 0');
    ok(root instanceof HGrid.Tree, 'HGrid.Tree.fromObject returns a HGrid.Tree');
    equal(root.children.length, data.length, 'Tree has as many children as the data');
    var subtree = root.children[0];
    equal(subtree.dataView, root.dataView, 'root and subtree point to the same DataView');
    equal(subtree.depth, 1, 'subtree depth is 1');
    equal(subtree.data.name, 'Documents');
    equal(subtree.data.kind, 'folder');
    var child = subtree.children[0];
    ok(child instanceof HGrid.Leaf, 'file is an HGrid.Leaf');
    equal(child.dataView, root.dataView, 'leaf and root point to the same DataView');
    equal(child.data.name, 'mydoc.txt');
    equal(child.data.kind, 'file');
    equal(child.depth, 2, 'child depth is 2');
    equal(root.dataView.getItems().length, root.toData().length, 'DataView and Tree have same data length');
  });

  module('Events, listeners, callbacks, oh my!', {
    setup: function() {
      myGrid = new HGrid('#myGrid', {
        data: testData
      });
    },
    teardown: function() {
      myGrid.destroy();
    }
  });

  /** Trigger a Slick.Event **/
  function triggerSlick(evt, args, e) {
    e = e || new Slick.EventData();
    args = args || {};
    args.grid = self;
    return evt.notify(args, e, self);
  }

  test('onClick callback', function() {
    expect(2);
    myGrid.options.onClick = function(event, element, item) {
      ok(element instanceof jQuery, 'element was set to a jQuery element');
      ok(typeof item === 'object', 'item was set to an item object');
    };
    // Trigger the Slick event
    triggerSlick(myGrid.grid.onClick, {
      row: 2
    });
  });

  test('onItemAdded callback', function() {
    expect(2);
    var newItem = {
      parentID: myGrid.getData()[0].id,
      name: 'New folder',
      kind: 'folder'
    };
    myGrid.options.onItemAdded = function(item) {
      equal(item.name, newItem.name, 'passes the added item');
      ok(this instanceof HGrid, 'context object is HGrid instance');
    };
    myGrid.addItem(newItem);

  });

  module('Tree-DataView binding', {
    teardown: function() {
      HGrid.Tree.resetIDCounter();
    }
  });

  test('Adding components to a tree in hierarchical order', function() {
    var root = new HGrid.Tree();
    equal(root.dataView.getItems().length, 0);
    var folder = new HGrid.Tree('Docs', 'folder');
    equal(root.dataView.getItems().length, 0);
    var subfolder = new HGrid.Tree('Scripts', 'folder');
    var file = new HGrid.Leaf('foo.js', 'file');
    root.add(folder, true);
    equal(root.dataView.getItems().length, 1);
    folder.add(subfolder, true);
    equal(root.dataView.getItems().length, 2);
    subfolder.add(file, true);
    equal(root.dataView.getItems().length, 3);
  });

  test('Adding components out of order', function() {
    var root = new HGrid.Tree();
    var subfolder = new HGrid.Tree('Scripts', 'folder');
    var file = new HGrid.Leaf('foo.js', 'file');
    var folder = new HGrid.Tree('Docs', 'folder');
    folder.add(subfolder);
    subfolder.add(file);
    root.add(folder);
    root.updateDataView();
    equal(root.dataView.getItems().length, 3);
  });

  module('Uploads', {});

  test('Creating an HGrid with uploads=true', function() {
    var grid = new HGrid('#myGrid', {
      uploads: true
    });
    ok(grid.dropzone, 'has a dropzone object');
    grid.destroy();
  });

  test('Overriding Dropzone options directly', function() {
    var grid = new HGrid('#myGrid', {
      uploads: true,
      dropzoneOptions: {
        parallelUploads: 123
      }
    });
    equal(grid.dropzone.options.parallelUploads, 123);
    grid.destroy();
  });

  test('Overriding Dropzone options with HGrid options', function() {
    var grid = new HGrid('#myGrid', {
      uploads: true,
      acceptedFiles: ['.py', 'application/pdf', 'image/*'],
      maxFilesize: 10,
      uploadMethod: 'PUT',
      uploadUrl: '/files/upload'
    });
    equal(grid.dropzone.options.acceptedFiles, '.py,application/pdf,image/*',
      'Dropzone `acceptedFiles` option was set');
    equal(grid.dropzone.options.maxFilesize, 10, 'maxFilesize was set');
    equal(grid.dropzone.options.method, 'PUT', 'method was set');
    equal(grid.dropzone.options.url, '/files/upload', 'url was set');
  });

  module('Dropzone callbacks', {
    setup: function() {
      myGrid = new HGrid('#myGrid', {
        uploads: true,
        data: testData
      });
    }
  });

  test('addedfile', function() {
    myGrid.currentTarget = myGrid.getData()[0];
    var file = getMockFile();
    var oldLength = myGrid.getData().length;
    var addedItem = myGrid.dropzoneEvents.addedfile.call(myGrid, file);
    equal(myGrid.getData().length, oldLength + 1, 'a row was added');
    var $rowElem = $(myGrid.getRowElement(addedItem.id));
    isTrue($rowElem.hasClass('hg-dl-started'),
      'hg-dl-started class was added to the row element');
    containsText('.slick-row', file.name, 'file name is in DOM');

  });

})(jQuery);
