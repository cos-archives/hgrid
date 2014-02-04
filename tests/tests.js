(function($) {
  'use strict';


  // Fixtures and factories
  var counter = 0;

  function getMockFile() {
    return {
      name: 'test file ' + counter++,
      size: 123456,
      type: 'text/html'
    };
  }

  function getTree() {
    var root = new HGrid.Tree();
    var tree = new HGrid.Tree({name: 'Tree', kind: 'folder'});
    var leaf = new HGrid.Leaf({name: 'Leaf', kind: 'item'});
    var subtree = new HGrid.Tree({name: 'Subtree', kind: 'folder'});
    var subsubtree = new HGrid.Tree({name: 'SubSubTree', kind: 'folder'});
    root.add(tree, true);
    tree.add(leaf, true);
    tree.add(subtree, true);
    subtree.add(subsubtree, true);
    return root;
  }

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
  },
    myGrid;

  function getMockGrid(args) {
    var options = $.extend({}, {
      data: testData
    }, args);
    var grid = new HGrid('#myGrid', options);
    return grid;
  }

  function createServer(endpoints) {
    var server = sinon.fakeServer.create();
    for (var url in endpoints) {
      server.respondWith('GET', url, [200, {'Content-Type': 'application/json'},
        JSON.stringify(endpoints[url])
        ]);
    }
    return server;
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

  test('Instantiation', function() {
    var grid2 = new HGrid('#myGrid', {
      data: testData
    });
    ok(grid2 instanceof HGrid, 'standard initialization');
  });

  test('jQuery initialization', function() {
    expect(1);
    $('#myGrid').hgrid({
      init: function() {
        ok(this instanceof HGrid);
      }
    });
  });

  test('jQuery initialization requires ID', function() {
    throws(function() {
      $('.no-id').hgrid({
        data: testData
      });
    }, HGrid.Error);
  });

  test('Initializing HGrid with data that has metadata', function() {
    var items = {
      data: [{
        name: 'foo.py',
        kind: HGrid.ITEM,
        lang: 'python'
      }, {
        name: 'bar.js',
        kind: HGrid.ITEM,
        lang: 'javascript'
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: items
    });
    equal(grid.getData()[0].lang, 'python', 'can get lang');
    equal(grid.getData()[1].lang, 'javascript', 'can get lang');
  });

  test('Initializing with array data', function() {
    var grid = new HGrid('#myGrid', {
      data: [{
        name: 'foo',
        kind: 'folder'
      }, {
        name: 'bar',
        kind: 'file'
      }]
    });
    equal(grid.getData()[0].name, 'foo');
    equal(grid.getData()[1].name, 'bar');
  });

  test('Initializing grid, overriding `id` property', function() {
    var items = {
      data: [{
        name: 'foo.py',
        kind: HGrid.ITEM,
        id: 'file1'
      }, {
        name: 'bar.js',
        kind: HGrid.ITEM,
        id: 'file2'
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: items
    });
    var foo = grid.getByID('file1');
    equal(foo.name, 'foo.py', 'retrieved correct item');
  });

  test('Default columns', function() {
    var grid = new HGrid('#myGrid');
    var cols = grid.grid.getColumns();
    equal(cols[0].name, 'Name');
    equal(cols[0].id, 'name');
    containsText('.slick-header', 'Name', 'name column is in DOM');
  });

  test('Changing column text by changing the defaultNameColumn object', function() {
    HGrid.Columns.Name.name = 'My Filename';
    var grid = new HGrid('#myGrid');
    var cols = grid.grid.getColumns();
    equal(cols[0].name, 'My Filename');
    containsText('.slick-header', 'My Filename', 'custom column name is in DOM');
  });

  test('Column header text can be set using the `text` property', function() {
    HGrid.Columns.Name.text = 'Custom Header';
    var grid = new HGrid('#myGrid');
    var cols = grid.grid.getColumns();
    equal(cols[0].name, 'Custom Header');
    containsText('.slick-header', 'Custom Header', 'custom column name is in DOM');
  });

  test('Options and attributes', function() {
    // passed in options
    deepEqual(myGrid.options.data, testData);
    // Default options
    deepEqual(myGrid.options.slickGridOptions, HGrid._defaults.slickGridOptions);
    equal(myGrid.options.navLevel, null);
    deepEqual(myGrid.options.columns, HGrid._defaults.columns, 'default columns are used');
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
      kind: HGrid.FOLDER
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

  test('render', function() {
    this.spy(myGrid.grid, 'render');
    myGrid.render();
    isTrue(myGrid.grid.render.calledOnce);
  });

  test('invalidate', function() {
    this.spy(myGrid.grid, 'invalidate');
    myGrid.invalidate();
    isTrue(myGrid.grid.invalidate.calledOnce);
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
    equal($elem.find('.hg-item-content').attr('data-id'), item.id, 'is the row for the correct item');
    isTrue($elem.find('.slick-cell.hg-cell').length > 0, 'cell has hg-cell class');
  });

  test('Expanding item', function() {
    var dat = {
      data: [{
        kind: HGrid.FOLDER,
        name: 'Docs',
        children: [{
          kind: HGrid.ITEM,
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

  test('onExpand', function() {
    var spy = this.spy();
    var grid = getMockGrid({
      onExpand: spy
    });
    var item = grid.getData()[0];
    grid.expandItem(item);
    ok(spy.calledOnce);
    equal(spy.args[0][1], item, 'second arg is item');
  });

  test('onCollapse', function() {
    var spy = this.spy();
    var grid = getMockGrid({
      onCollapse: spy
    });
    var item = grid.getData()[0];
    grid.collapseItem(item);
    ok(spy.calledOnce);
    equal(spy.args[0][1], item, 'second arg is item');
  });

  test('Toggle collapse', function() {
    var dat = {
      data: [{
        kind: HGrid.FOLDER,
        name: 'Docs',
        children: [{
          kind: HGrid.ITEM,
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

  test('Emptying folder', function() {
    var grid = getMockGrid();
    var folder = grid.getData()[0];
    var item = folder._node.children[0].getItem();
    this.spy(folder._node, 'empty');
    containsText('.slick-cell', item.name, 'sanity check');
    grid.emptyFolder(folder);
    isTrue(folder._node.empty.calledOnce);
    notContainsText('.slick-cell', item.name, 'child was removed from DOM');
    containsText('.slick-cell', folder.name, 'folder was not removed from DOM');
  });

  test('Collapse filter', function() {
    var myData = {
      data: [{
        name: 'Parent',
        kind: HGrid.FOLDER,
        children: [{
          name: 'Child',
          kind: HGrid.ITEM
        }]
      }]
    };
    var grid = new HGrid('#myGrid', {
      data: myData
    });
    var parent = grid.getData()[0];
    parent._collapsed = false;
    var child = grid.getData()[1];
    isTrue(HGrid._hgFilter(child, {
      thisObj: grid,
      rootID: 'root'
    }), 'returns true if parent is not collpased');
    parent._node.collapse();
    child = grid.getData()[1];
    isFalse(HGrid._hgFilter(child, {
      thisObj: grid,
      rootID: 'root'
    }), 'returns false if parent is collapsed');
  });

  test('Adding item to a grid with no data', function() {
    var grid = new HGrid('#myGrid');
    var addedItem = grid.addItem({
      name: 'First',
      kind: HGrid.FOLDER
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

  test('aliases', function() {
    deepEqual(HGrid.Fmt, HGrid.Format);
    deepEqual(HGrid.Col, HGrid.Columns);
  });

  module('Tree and leaf', {
    teardown: function() {
      HGrid.Tree.resetIDCounter();
    }
  });

  test('Tree and DataView', function() {
    var root = new HGrid.Tree();
    ok(root.dataView, 'root has a dataView attribute');
    var subtree = new HGrid.Tree({
      name: 'Docs',
      kind: HGrid.FOLDER
    });
    root.add(subtree);
    strictEqual(root.dataView, subtree.dataView);
  });

  test('Creating Trees and Leaves', function() {
    var root = new HGrid.Tree();
    equal(root.id, 'root', 'root id is "root"');
    var tree1 = new HGrid.Tree({
      name: 'My Documents',
      kind: HGrid.FOLDER
    });
    equal(tree1.id, 0);
    equal(tree1.data.kind, HGrid.FOLDER, 'sets the tree kind');
    var tree2 = new HGrid.Tree({
      name: 'My Music',
      kind: HGrid.FOLDER
    });
    equal(tree2.id, 1);
    var leaf1 = new HGrid.Leaf({
      name: 'foo.py',
      kind: HGrid.ITEM
    });
    equal(leaf1.id, 2);
    equal(leaf1.data.kind, HGrid.ITEM, 'sets the leaf kind');
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
      kind: HGrid.FOLDER
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
      kind: HGrid.ITEM
    });
    root.add(leaf);
    root.updateDataView();
    var leafItem = leaf.getItem();
    equal(leafItem.kind, HGrid.ITEM);
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

  test('Tree.collapseAtDepth()', function() {
    var root = new HGrid.Tree();
    var t1 = new HGrid.Tree({name: 'D1 Node', kind: 'folder'});
    var t2 = new HGrid.Tree({name: 'D2 Node', kind: 'folder'});
    var t3 = new HGrid.Tree({name: 'D3 Node', kind: 'folder'});
    var t4 = new HGrid.Tree({name: 'D3 Node 2', kind: 'folder'});
    root.add(t1, true);
    t1.add(t2, true);
    t2.add(t3, true);
    t2.add(t4, true);
    root.collapseAt(2);
    isTrue(t2.isCollapsed(), 'depth 2 node is collapsed');
    isFalse(t1.isCollapsed(), 'depth 1 node is not collapsed');
    isTrue(t3.isHidden(), 'depth 3 node is hidden');
    isTrue(t4.isHidden(), 'another depth 3 node is hidden');
  });

  test('Tree.expandAt()', function() {
    var root = new HGrid.Tree();
    var t1 = new HGrid.Tree({name: 'D1 Node', kind: 'folder'});
    var t2 = new HGrid.Tree({name: 'D2 Node', kind: 'folder'});
    var t3 = new HGrid.Tree({name: 'D3 Node', kind: 'folder'});
    var t4 = new HGrid.Tree({name: 'D3 Node 2', kind: 'folder'});
    root.add(t1, true);
    t1.add(t2, true);
    t2.add(t3, true);
    t2.add(t4, true);
    root.collapseAt(1, true);
    root.expandAt(2, true);
    isFalse(t2.isCollapsed(), 'depth 2 node is not collapsed');
    isFalse(t1.isCollapsed(), 'depth 1 node is collapsed');
    isFalse(t3.isHidden(), 'depth 3 node is not hidden');
    isFalse(t4.isHidden(), 'another depth 3 node is not hidden');
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
  });

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
    var t1 = new HGrid.Tree({
      name: 'foo.py',
      kind: HGrid.FOLDER,
      language: 'python'
    });
    equal(t1.data.language, 'python');
    equal(t1.id, 0);
  });

  test('Depths', function() {
    var root = new HGrid.Tree();
    var subtree = new HGrid.Tree('Subtree', HGrid.FOLDER);
    var subsubtree = new HGrid.Tree('Another subtree', HGrid.FOLDER);
    var leaf = new HGrid.Leaf('Leaf', HGrid.ITEM);
    var rootLeaf = new HGrid.Leaf('Root leaf', HGrid.ITEM);
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
      kind: HGrid.FOLDER
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
      kind: HGrid.ITEM
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
      kind: HGrid.ITEM,
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
  });

  test('Tree.empty', function() {
    var tree = getTree();
    var node = tree.children[0];
    var child = node.children[0];
    node.empty();
    equal(node.children.length, 0);
    equal(child.children.length, 0);
  });

  test('Constructing leaf from object', function() {
    var file = HGrid.Leaf.fromObject({
      name: 'foo.py',
      kind: HGrid.ITEM
    });
    ok(file instanceof HGrid.Leaf, 'fromObject returns a HGrid.Leaf');
    equal(file.data.name, 'foo.py');
    equal(file.data.kind, HGrid.ITEM);
  });

  test('Constructing tree from object', function() {
    var data = [{
      name: 'Documents',
      kind: HGrid.FOLDER,
      children: [{
        name: 'mydoc.txt',
        kind: HGrid.ITEM
      }, {
        name: 'Scripts',
        kind: HGrid.FOLDER,
        children: [{
          name: 'script.py',
          kind: HGrid.ITEM
        }, {
          name: 'JS scripts',
          kind: HGrid.FOLDER,
          children: []
        }]
      }]
    }, {
      name: 'rootfile.js',
      kind: HGrid.ITEM
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
    equal(subtree.data.kind, HGrid.FOLDER);
    var child = subtree.children[0];
    ok(child instanceof HGrid.Leaf, 'file is an HGrid.Leaf');
    equal(child.dataView, root.dataView, 'leaf and root point to the same DataView');
    equal(child.data.name, 'mydoc.txt');
    equal(child.data.kind, HGrid.ITEM);
    equal(child.depth, 2, 'child depth is 2');
    equal(root.dataView.getItems().length, root.toData().length, 'DataView and Tree have same data length');
  });


  var tree, data;
  module('Sorting trees', {
    setup: function() {
      data = [{
        name: 'Documents',
        kind: HGrid.FOLDER,
        children: [{
          name: 'b.txt',
          kind: HGrid.ITEM
        }, {
          name: 'a.txt',
          kind: HGrid.ITEM
        }]
      }, {
        name: 'Scripts',
        kind: HGrid.FOLDER,
        children: [{
          name: 'foo.py',
          kind: HGrid.ITEM
        }, {
          name: 'bar.js',
          kind: HGrid.ITEM
        }]
      }];
      tree = new HGrid.Tree.fromObject(data);
    }
  });

  test('basic sorting', function() {
    equal(tree.toData()[0].name, 'Documents');
    tree.sort('name', true);
    var sortedData = tree.toData();
    equal(sortedData[0].name, 'Documents');
    equal(sortedData[1].name, 'a.txt');
    equal(sortedData[2].name, 'b.txt');
  });

  test('sorting descending', function() {
    tree.sort('name', false);
    var sorted = tree.toData();
    equal(sorted[0].name, 'Scripts');
    equal(sorted[1].name, 'foo.py');
    equal(sorted[2].name, 'bar.js');
  });

  module('Slickgrid events', {
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
    // Just test that options.onClick was called
    var spy = this.spy();
    myGrid.options.onClick = spy;
    triggerSlick(myGrid.grid.onClick);
    ok(spy.calledOnce);
  });

  test('onSort callback', function() {
    expect(2);
    var column = myGrid.grid.getColumns()[0];
    this.spy(myGrid.tree, 'sort');
    this.spy(myGrid.tree, 'updateDataView');
    myGrid.options.onSort = function(event, colDef) {
      deepEqual(colDef, column, 'column arg is correct');
    };
    triggerSlick(myGrid.grid.onSort, {
      sortCol: column,
      sortAsc: true
    });
    ok(myGrid.tree.sort.calledWith(column.sortkey, true), 'sort was called');
  });

  test('onSort without a sortkey throws exception', function() {
    throws(function() {
      triggerSlick(myGrid.grid.onSort, {
        sortCol: {} // no sortkey
      });
    }, HGrid.Error, 'HGrid error is thrown');
  });

  test('onMouseLeave', function() {
    this.spy(myGrid, 'removeHighlight');
    triggerSlick(myGrid.grid.onMouseLeave);
    ok(myGrid.removeHighlight.calledOnce, 'removes highlight');
  });

  test('onItemAdded callback', function() {
    expect(2);
    var newItem = {
      parentID: myGrid.getData()[0].id,
      name: 'New folder',
      kind: HGrid.FOLDER
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
    var folder = new HGrid.Tree('Docs', HGrid.FOLDER);
    equal(root.dataView.getItems().length, 0);
    var subfolder = new HGrid.Tree('Scripts', HGrid.FOLDER);
    var file = new HGrid.Leaf('foo.js', HGrid.ITEM);
    root.add(folder, true);
    equal(root.dataView.getItems().length, 1);
    folder.add(subfolder, true);
    equal(root.dataView.getItems().length, 2);
    subfolder.add(file, true);
    equal(root.dataView.getItems().length, 3);
  });

  test('Adding components out of order', function() {
    var root = new HGrid.Tree();
    var subfolder = new HGrid.Tree('Scripts', HGrid.FOLDER);
    var file = new HGrid.Leaf('foo.js', HGrid.ITEM);
    var folder = new HGrid.Tree('Docs', HGrid.FOLDER);
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

  var file;
  module('Dropzone callbacks', {
    setup: function() {
      myGrid = new HGrid('#myGrid', {
        // uploads: true,
        data: testData
      });
      myGrid.currentTarget = myGrid.getData()[0];
      file = getMockFile();
      file.gridElement = myGrid.getRowElement(myGrid.getData()[1].id);
    },
    teardown: function() {
      myGrid.destroy();
      // myGrid.dropzone.destroy();
    }
  });

  test('default addedfile', function() {
    this.spy(myGrid, 'validateTarget');
    this.spy(myGrid.options, 'uploadAdded');
    myGrid.currentTarget = myGrid.getData()[0];
    var oldLength = myGrid.getData().length;
    var addedItem = myGrid.dropzoneEvents.addedfile.call(myGrid, file);
    equal(myGrid.getData().length, oldLength + 1, 'a row was added');
    var $rowElem = $(myGrid.getRowElement(addedItem.id));
    isTrue($rowElem.hasClass('hg-upload-started'),
      'hg-upload-started class was added to the row element');
    containsText('.slick-row', file.name, 'file name is in DOM');
    isTrue(myGrid.validateTarget.calledWith(myGrid.currentTarget));
    ok(myGrid.options.uploadAdded.calledOnce);
    equal(myGrid.options.uploadAdded.args[0][1], addedItem, 'second argument is addedItem');
    equal(myGrid.options.uploadAdded.args[0][2], myGrid.currentTarget, 'third argument is current upload target');
  });

  test('drop', function() {
    var dropSpy = this.spy();
    var grid = getMockGrid({
      onDrop: dropSpy,
      uploads: true
    });
    this.spy(grid, 'setUploadTarget');
    this.spy(grid, 'validateTarget');
    var folder = grid.getData()[0];
    grid.currentTarget = folder;
    grid.dropzone.emit('drop');
    isTrue(dropSpy.calledOnce, 'options.onDrop is called');
    equal(dropSpy.args[0][1], grid.currentTarget, 'second arg is currentTarget');
    isTrue(grid.setUploadTarget.calledWith(folder), 'upload target is set');
    isTrue(grid.validateTarget.calledWith(grid.currentTarget), 'target was validated');
  });


  test('error callback', function() {
    var grid = getMockGrid({
      uploads: true
    });
    var message = {
      error: 'Could not upload file'
    };
    file.gridElement = grid.getRowElement(grid.getData()[1].id);
    var $row = $(file.gridElement);
    $row.addClass('hg-upload-processing');
    grid.dropzoneEvents.error.call(grid, file, message);
    isTrue($row.hasClass('hg-upload-error'), 'row element has hg-upload-error class');
    isFalse($row.hasClass('hg-upload-processing'), 'hg-upload-processing class was removed');
    // containsText('.slick-cell', message.error, 'Cell contains error message');
  });

  test('default processing callback', function() {
    this.spy(myGrid.options, 'uploadProcessing');
    myGrid.currentTarget = myGrid.getData()[0];
    myGrid.dropzoneEvents.processing.call(myGrid, file);
    var $row = $(file.gridElement);
    isTrue($row.hasClass('hg-upload-processing'), 'row has hg-upload-processing class');
    ok(myGrid.options.uploadProcessing.calledOnce);
    equal(myGrid.options.uploadProcessing.args[0][2], myGrid.currentTarget, 'third argument is curernt upload target');
  });

  test('default success callback', function() {
    var $row = $(file.gridElement);
    $row.addClass('hg-upload-processing');
    myGrid.dropzoneEvents.success.call(myGrid, file);
    isTrue($row.hasClass('hg-upload-success'), 'row has hg-upload-success class');
  });

  test('uploadComplete callback', function() {
    expect(3); // Make sure callback executes
    var file = getMockFile();
    var grid = new HGrid('#myGrid', {
      data: testData,
      // Just check that the params are ok
      uploadComplete: function(file, item) {
        var $row = $(file.gridElement);
        ok(typeof(file) === 'object');
        ok(typeof(item) === 'object');
        isFalse($row.hasClass('hg-upload-processing'), 'hg-upload-processing class was removed');
      }
    });
    var folder = grid.getData()[0];
    file.gridItem = grid.addItem({
      name: 'New file',
      kind: HGrid.ITEM,
      parentID: folder.id
    });
    grid.currentTarget = folder;
    grid.dropzoneEvents.complete.call(grid, file);
  });

  test('setUploadTarget', function() {
    var headers = {'My-Awesome-Header': 'header value'};
    var grid = new HGrid('#myGrid', {
      data: testData,
      uploads: true,
      uploadUrl: function(folder) {
        return 'uploads/' + folder.id;
      },
      uploadMethod: function(folder) {
        deepEqual(this.getData()[0], folder);
        return 'PUT';
      },
      uploadHeaders: function(folder) {
        return headers;
      }
    });
    var folder = grid.getData()[0];
    grid.currentTarget = folder;
    grid.setUploadTarget(folder);
    equal(grid.dropzone.options.url, 'uploads/' + folder.id, 'upload url was set');
    equal(grid.dropzone.options.method, 'PUT', 'upload method was set');
    deepEqual(grid.dropzone.options.headers, headers, 'headers were set');
  });

  test('setUploadTarget sets dropzone accept function', function() {
    var acceptSpy = this.spy();
    var file = getMockFile();
    var grid = new HGrid('#myGrid', {
      data: testData,
      uploads: true,
      uploadAccept: acceptSpy
    });
    var folder = grid.getData()[0];
    grid.currentTarget = folder;
    grid.setUploadTarget(folder);
    grid.dropzone.options.accept(file, this.spy()); // Call dropzone accept method
    isTrue(acceptSpy.called, 'dropzone accept function calls grid.options.uploadAccept');
    equal(acceptSpy.args[0][0], file, 'first argument was the file object');
  });


  module('Formatting helpers (HGrid.Format)', {});

  test('renderButton', function() {
    var btnDef = {
      id: 'testbtn',
      text: 'Test Button',
      cssClass: 'test-btn',
      action: 'myaction'
    };
    var $btn = $(HGrid.Format.button(btnDef));
    isTrue($btn.hasClass('hg-btn'), 'button has hg-btn class');
    isTrue($btn.hasClass('test-btn'), 'has user-defined class');
    equal($btn.text().trim(), btnDef.text.trim(), 'text is correct');
    equal($btn.data('hg-action'), 'myaction', 'has correct action');
  });

  test('withIndent', function() {
    var depth = 4;
    var item = getMockItem({
      depth: depth
    });
    var html = '<p>test</p>';
    var withIndent = HGrid.Format.withIndent(item, html);
    var $elem = $(withIndent);
    isTrue($elem.length > 0, 'has .hg-indent element');
    equal($elem.css('width'), HGrid._defaults.indent * depth + 'px', 'width is correct');
  });

  test('asName', function() {
    var item = getMockItem();
    var html = '<p>test</p>';
    var itemHtml = HGrid.Format.asName(item, html);
    var $elem = $(itemHtml);
    equal($elem.data('id'), item.id, 'has data-id');
    isTrue($elem.hasClass('hg-item-content'), 'has hg-item-content class');
  });

  test('renderButton default action', function() {
    var btnDef = {
      id: 'testbtn',
      text: 'Test Button',
      cssClass: 'test-btn'
    };
    var $btn = $(HGrid.Format.button(btnDef));
    equal($btn.data('hg-action'), 'noop', 'default action is noop');
  });

  test('tpl', function() {
    equal(HGrid.Format.tpl('{{greeting}} {{ name }}', {
      greeting: 'Hello',
      name: 'world'
    }), 'Hello world');
  });

  module('Actions', {});

  test('download action', function() {
    this.spy(HGrid.Actions.download, 'callback');
    var optionSpy = this.spy();
    var grid = getMockGrid({
      data: testData,
      uploads: true,
      onClickDownload: optionSpy,
      columns: [HGrid.Columns.Name, HGrid.Columns.ActionButtons]
    });
    // Click one of the download buttons
    grid.element.find('[data-hg-action="download"]').eq(1).trigger('click');
    isTrue(HGrid.Actions.download.callback.calledOnce, 'triggers the "download" callback');
    isTrue(optionSpy.calledOnce);
  });

  test('custom actions', function() {
    var spy = this.spy();
    HGrid.Actions.testaction = {
      on: 'click',
      callback: spy
    };
    var buttonCol = {
      text: 'My buttons',
      itemView: function() {
        return HGrid.Format.button({
          text: 'Test',
          action: 'testaction'
        });
      }
    };
    var grid = getMockGrid({
      columns: [buttonCol]
    });
    grid.element.find('[data-hg-action="testaction"]').eq(1).trigger('click');
    isTrue(spy.calledOnce, 'action callback was triggered');
  });

  test('actions option', function() {
    var grid = getMockGrid({
      actions: {
        myaction: {
          on: 'click',
          callback: function() {}
        }
      }
    });
    isTrue('myaction' in HGrid.Actions, 'new action was registered');
  });

  var server;
  module('Async loading', {
    setup: function() {
      var endpoints = {
        '/hgrid/data': testData
      };
      server = createServer(endpoints);
    },
    teardown: function() {
      server.restore();
    }
  });
  // Sanity check
  asyncTest('server responds with test data', function() {
    $.getJSON('/hgrid/data', function(data) {
      deepEqual(data, testData, 'correct response');
    })
      .done(function() {
        start(); // Start the tests
      });
    server.respond();
  });

  asyncTest('Initializing hgrid with a URL sends an ajax request', function() {
    this.spy(jQuery, 'ajax');
    var grid = new HGrid('#myGrid', {
      data: '/hgrid/data',
      ajaxOptions: {
        complete: function() {
          start();
        },
        success: function() {}
      }
    });
    server.respond();
    sinon.assert.calledOnce(jQuery.ajax, 'ajax request was sent');
  });

  asyncTest('getFromServer', function() {
    expect(2);
    var grid = getMockGrid({
      ajaxOptions: {
        complete: function() {
          start();
        }
      }
    });
    grid.getFromServer('/hgrid/data', function(data) {
        isTrue(this instanceof HGrid);
        deepEqual(data, testData, 'return data is correct');
    });
    server.respond();
  });

  module('Queue', {});

  test('basic queue operations', function() {
    var q = new HGrid.Queue();
    q.enq(4);
    q.enq(2);
    equal(q.deq(), 4);
    equal(q.deq(), 2);
    equal(q.deq(), undefined);
  });

  module('Permissions', {});

  test('canUpload', function() {
    var grid = getMockGrid({
      uploads: true,
      canUpload: function(item) { return item.hasPermission; }
    });
    isFalse(grid.canUpload(undefined));
    isFalse(grid.canUpload(null));
    isFalse(grid.canUpload(getMockItem({hasPermission: false})));
    isTrue(grid.canUpload(getMockItem({hasPermission: true})));
  });

  test('denyUpload', function() {
    var spy = this.spy();
    var grid = getMockGrid({
      uploads: true,
      uploadDenied: spy
    });
    throws(function() {
      grid.denyUpload(getMockItem());
    }, HGrid.Error);
    sinon.assert.calledOnce(spy);
  });

  test('validateTarget', function() {
    var item = getMockItem({hasPerm: false});
    var grid = getMockGrid({
      uploads: true,
      canUpload: function(item) {return item.hasPerm; }
    });
    throws(function() {
      grid.validateTarget(item);
    }, HGrid.Error);
    var valid = getMockItem({hasPerm: true});
    deepEqual(grid.validateTarget(valid), valid, 'item is returned if validated');
  });

  module('Adding data', {});

  test('addData', function() {
    var grid = getMockGrid({
      data: [{name: 'Computer', kind: 'folder', id: 0, children: []}]
    });
    var toAdd = {
      data: [{name: 'Docs', kind: 'folder',
              children: [{name: 'mydoc.txt', kind: 'folder'}
              ]}]
    };
    grid.addData(toAdd, 0);
    var addedNode = grid.tree.children[0].children[0];
    equal(addedNode.data.name, 'Docs');
    equal(addedNode.children[0].data.name, 'mydoc.txt');
    containsText('.slick-cell', 'Docs', 'folder added to DOM');
    containsText('.slick-cell', 'mydoc.txt', 'fileadded to DOM');
  });

  // FIXME: This test fails every other time it is run in the browser. Not sure why.
  // var lazyserver;
  // module('Lazy loading', {
  //   setup: function() {
  //     // include explicit Ids to so items can be retrieved easily
  //     var endpoints = {
  //       '/grid/': [{name: 'Codes', id: 0, slug: 'codes', kind: 'folder', children: []},
  //                   {name: 'Music', id: 1, slug: 'music', kind: 'folder', children: []}],
  //       '/grid/codes': [{name: 'foo.py', id: 2, kind: 'item'}, {name: 'bar.js', id: 3, kind: 'item'}],
  //       '/grid/music': [{name: 'psycho-killer.mp3', id: 4, kind: 'item'}, {name: 'Stones', id: 5, slug: 'stones', kind: 'folder'}]
  //     };
  //     lazyserver = createServer(endpoints);
  //   },
  //   teardown: function() {
  //     lazyserver.restore();
  //   }
  // });

  // test('fetching folder contents on expand calls get items from server once', function() {
  //   var grid = new HGrid('#myGrid', {
  //     data: '/grid/',  // Initial data
  //     fetchUrl: function(item) {
  //       if (item.slug) {
  //         return '/grid/' + item.slug;
  //       }
  //       return null;
  //     },
  //     // init: function() {
  //     //   start();
  //     // }
  //   });
  //   lazyserver.respond();  // Respond to initial request for data
  //   notContainsText('.slick-cell', 'foo.py', 'contents not yet in DOM');  // Sanity check
  //   this.spy(grid, 'getFromServer');
  //   var folder = grid.getData()[0];
  //   grid.expandItem(folder.id);
  //   lazyserver.respond();  // Respond to request for expanded item's contents
  //   ok(grid.getFromServer.calledOnce);
  //   containsText('.slick-cell', 'foo.py', 'contents are shown in DOM');
  //   grid.collapseItem(folder.id);
  //   notContainsText('.slick-cell', 'foo.py');  // Sanity check
  //   // Expand item again
  //   grid.expandItem(folder.id);
  //   equal(grid.getFromServer.callCount, 1, 'getFromServer was only called once');
  //   containsText('.slick-cell', 'foo.py');
  //   grid.destroy();
  // });

  test('isLazy', function() {
    var grid = getMockGrid( {
      fetchUrl: function() {
        return '/grid';
      }
    });
    isTrue(grid.isLazy());
  });

  test('not lazy', function() {
    var grid = getMockGrid({fetchUrl: null});
    isFalse(grid.isLazy());
  });

  module('deleting files', {});

  test('deleteFile sends ajax request', function() {
    var server = sinon.fakeServer.create();
    server.respondWith('DELETE', '/deleteitem', [200, {'Content-Type': 'application/json'},
        JSON.stringify({'success': true})
    ]);
    var grid = getMockGrid({
      deleteUrl: '/deleteitem'
    });
    var item = grid.getData()[1];
    this.spy($, 'ajax');
    grid.deleteFile(item);
    server.respond();
    ok($.ajax.calledOnce);
  });


})(jQuery);
