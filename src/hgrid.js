/**
 * Provides the main HGrid class and HGridError.
 * @module HGrid
 */
if (typeof jQuery === 'undefined') {
  throw 'HGrid requires jQuery to be loaded';
}
(function($, window, document, undefined) {
  'use strict';
  // Exports
  window.HGrid = HGrid;
  window.HGridError = HGridError;

  /**
   * Custom Error for HGrid-related errors.
   *
   * @class  HGridError
   * @constructor
   */
  function HGridError(message) {
    this.name = 'HGridError';
    this.message = message || '';
  }
  HGridError.prototype = new Error();

  /////////////////////
  // Private Members //
  /////////////////////
  var ROOT_ID = 'root';
  var FILE = 'file';
  var FOLDER = 'folder';

  /**
   * Render a spacer element given an indent value in pixels.
   */
  function makeIndentElem(indent) {
    return '<span class="hg-indent" style="width:' + indent + 'px"></span>';
  }

  // TODO: expose this function as a helper?
  /**
   * Sanitize a value to be displayed as HTML.
   */
  function sanitized(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Factory that returns a SlickGrid formatter function that uses
   * the passed in folder rendering function and file rendering function.
   *
   * See: https://github.com/mleibman/SlickGrid/blob/gh-pages/examples/example2-formatters.html
   *
   * @param  {Function} folderFunc Function that returns the HTML for a folder.
   * @param  {Function} fileFunc   Function that returns the HTML for a file.
   * @return {Function}            A SlickGrid formatter function, used by Slick.Data.DataView.
   */
  function makeFormatter(folderFunc, fileFunc, indentWidth) {
    var formatter = function(row, cell, value, columnDef, item) {
      // Opening and closing tags that surround a row
      var openTag = '<span class="hg-item" data-id="' + item.id + '">';
      var closingTag = '</span>';
      var indent = item.depth * indentWidth;
      // indenting span
      var spacer = makeIndentElem(indent);
      if (item.kind === FOLDER) {
        return [openTag, spacer, folderFunc(item), closingTag].join(' ');
      } else {
        return [openTag, spacer, fileFunc(item), closingTag].join(' ');
      }
    };
    return formatter;
  }

  /**
   * Filter used by SlickGrid for collapsing/expanding folder.
   *
   * @param {Object} item The item object
   * @param {Object} args Contains "thisObj" and "rootID" properties
   * @returns {Boolean} Whether to display the item or not.
   */
  function collapseFilter(item, args) {
    var self = args.thisObj; // the 'this' object is passed as an extra argument so methods are accessible
    var rootID = args.rootID;
    if (item.parentID !== rootID) {
      var parent = self.getByID.call(self, item.parentID);
      while (parent) {
        if (parent._collapsed) {
          return false;
        }
        parent = self.getByID.call(self, parent.parentID);
      }
    }
    return true;
  }

  function canToggle($elem) {
    return $elem.hasClass('toggle');
  }

  var requiredColumns = [{
    id: 'name',
    name: 'Name',
    field: 'name',
    cssClass: 'cell-title',
    defaultSortAsc: true
  }];

  /**
   * Default options object
   * @class  defaults
   */
  var defaults = {
    /**
     * The data for the grid.
     * @property data
     */
    data: null,
    // Root URL to get data at
    // ajaxSource: null,
    // URL where to retrieve a folder's contents (only used if using ajaxSource)
    // itemUrl: function(ajaxSource, item) {
    //   return ajaxSource + item.id.toString();
    // },
    // Callback on AJAX success
    // ajaxOnSuccess: null,
    // Callback on AJAX error
    // ajaxOnError: null,
    // Callback on AJAX complete
    // ajaxOnComplete: null,
    // Additional options to be passed into $.ajax when sending AJAX requests
    // ajaxOptions: {},
    // lazyLoad: false,
    columns: requiredColumns,
    // dropZonePreviewsContainer: null,
    // dropZoneOptions: null,
    // navLevel: null,
    // CSS selector for the breadcrumb box
    // breadcrumbBox: null,
    // clickUploadElement: true,
    // topCrumb: true,
    // navigation: true,
    /**
     * @property  [width] Width of the grid
     */
    width: 600,
    /**
     * Height of the grid div in px or 'auto' (to disable vertical scrolling).*
     * @property [height]
     */
    height: 'auto',
    /**
     * CSS class to apply to the grid element. Can also be an array of multiple classes.
     * @property cssClass
     */
    cssClass: 'hgrid',
    /**
     * Width to indent items (in px)*
     * @property indent
     */
    indent: 15,
    /**
     * Render a folder to HTML.
     * @property renderFolder
     * @type {Function}
     * @param  {Object} item The folder as an item object.
     * @return {String}      HTML for the folder.
     */
    renderFolder: function(item) {
      var name = sanitized(item.name);
      // The + / - button for expanding/collapsing a folder
      var expander = item._collapsed ? '<span class="toggle expand"></span>' :
        '<span class="toggle collapse"></span>';
      // The folder icon
      var folderIcon = ' <span class="hg-folder"></span>';
      // Concatenate the expander, folder icon, and the folder name
      return [expander, folderIcon, name].join(' ');
    },
    /**
     * Render a file to HTML.
     * @property renderFile
     * @param  {Object} item The file as an item object.
     * @return {String}      HTML for the file.
     */
    renderFile: function(item) {
      var fileIcon = '<span class="hg-file"></span>';
      return [fileIcon, sanitized(item.name)].join(' ');
    },
    /**
     * Options passed to Slick.Grid constructor
     * See: https://github.com/mleibman/SlickGrid/wiki/Grid-Options
     * @property slickGridOptions
     */
    slickGridOptions: {
      editable: false,
      asyncEditorLoading: false,
      enableCellNavigation: false,
      enableColumnReorder: false, // column reordering requires jquery-ui.sortable
      forceFitColumns: true
    },
    /**
     * Callback function executed after an item is clicked.
     * By default, expand or collapse the item.
     * @property [onClick]
     */
    onClick: function(event, element, item, grid) {
      if (canToggle(element)) {
        grid.toggleCollapse(item);
      }
      event.stopImmediatePropagation();
    },
    /**
     * Callback executed after an item is added.
     * @property [onAdd]
     */
    /*jshint unused: false */
    onAdd: function(item, grid) {}
  };

  ///////////////////////////////////
  // Tree and Leaf Representations //
  ///////////////////////////////////

  var idCounter = 0; // Ensure unique IDs among trees and leaves
  /**
   * A tree node. If constructed with no args, the node is
   * considered a root,
   *
   * ```
   * var root = new HGrid.Tree();
   * root.depth // => 0
   * var subtree = new Tree('A subtree', 'folder');
   * root.add(subtree);
   * subtree.depth  // => 1
   * ```
   *
   * @class HGrid.Tree
   * @constructor
   * @param {String} [name] Name of the node.
   * @param {String} [kind] Either "file" or folder
   */
  function Tree(name, kind) {
    if (name === undefined && kind === undefined) { // No args passed, it's a root
      this.name = null;
      this.kind = null;
      this.id = ROOT_ID;
      /**
       * @attribute  depth
       * @type {Number}
       */
      this.depth = 0;
      this.dataView = new Slick.Data.DataView({
        inlineFilters: true
      });
    } else {
      this.name = name;
      this.kind = kind;
      this.id = idCounter++; // set id then increment counter
      // Depth and dataView will be set by parent after being added as a subtree
      this.depth = null;
      this.dataView = null;
    }
    this.children = [];
    this.parentID = null;
    return this;
  }
  /**
   * Construct a new Tree from either an object or an array of data.
   *
   * Example output:
   * ```
   * [{name: 'Documents', kind: 'folder',
   *  children: [{name: 'mydoc.txt', type: 'file'}]},
   *  {name: 'rootfile.txt', kind: 'file'}
   *  ]
   *  ```
   *
   * @method fromObject
   * @param {Object} data
   * @param {parent} [parent] Parent item.
   *
   */
  Tree.fromObject = function(data, parent) {
    var tree, children, leaf, subtree;
    // If data is an array, create a new root
    if (Array.isArray(data)) {
      tree = new Tree();
      children = data;
    } else { // data is an object, create a subtree
      tree = new Tree(data.name, data.kind);
      tree.depth = parent.depth + 1;
      children = data.children || [];
    }
    for (var i = 0, len = children.length; i < len; i++) {
      var child = children[i];
      if (child.kind === FILE) {
        leaf = Leaf.fromObject(child);
        tree.add(leaf);
      } else {
        subtree = Tree.fromObject(child, tree);
        tree.add(subtree);
      }
    }
    return tree;
  };

  Tree.resetIDCounter = function() {
    idCounter = 0;
  };
  Tree._getCurrentID = function() {
    return idCounter;
  };

  /**
   * Add a component to this node
   * @method  add
   * @param component      Either a Tree or Leaf.
   * @param {Boolean} [updateDataView] Whether to insert the item into the DataView
   */
  Tree.prototype.add = function(component, updateDataView) {
    // Set deptth, parent ID, and dataview
    component.parentID = this.id;
    component.depth = this.depth + 1;
    component.dataView = this.dataView;
    this.children.push(component);
    if (updateDataView) {
      this.insertIntoDataView(component);
    }
    return this;
  };

  /**
   * Computes the index in the DataView where to insert an item, based on
   * the item's parentID property.
   */
  function computeAddIdx(item, dataView) {
    var parent = dataView.getItemById(item.parentID);
    if (parent) {
      return dataView.getIdxById(parent.id) + 1;
    }
    return 0;
  }

  Tree.prototype.insertIntoDataView = function(component) {
    this.dataView.beginUpdate();
    var data = component.toData();
    var idx;
    if (Array.isArray(data)) {
      for (var i = 0, len = data.length; i < len; i++) {
        var datum = data[i];
        idx = computeAddIdx(datum, this.dataView);
        this.dataView.insertItem(idx, datum);
      }
    } else { // data is an Object, so component is a leaf
      idx = computeAddIdx(data, this.dataView);
      this.dataView.insertItem(idx, data);
    }
    this.dataView.endUpdate();
  };

  /**
   * Update the dataview with this tree's data. This should only be called on
   * a root node.
   *
   * @param {Boolean} suspend If true, don't refresh the data view after setting
   *                          the items. Useful for batch operations.
   */
  Tree.prototype.updateDataView = function() {
    if (!this.dataView) {
      throw new HGridError('Tree does not have a DataView. updateDataView must be called on a root node.');
    }
    this.dataView.beginUpdate();
    this.dataView.setItems(this.toData());
    this.dataView.endUpdate();
    return this;
  };

  /**
   * Convert the tree to SlickGrid-compatible data
   *
   * @param {Array} result Memoized result.
   * @return {Array} Array of SlickGrid data
   */
  Tree.prototype.toData = function(result) {
    // Add this node's data, unless it's a root
    var data = result || [];
    if (this.depth !== 0) {
      var thisItem = {
        name: this.name,
        id: this.id,
        parentID: this.parentID,
        kind: this.kind,
        _node: this,
        depth: this.depth
      };
      data.push(thisItem);
    }
    for (var i = 0, len = this.children.length; i < len; i++) {
      var child = this.children[i];
      child.toData(data);
    }
    return data;
  };

  /**
   * Leaf representation
   * @class  HGrid.Leaf
   * @constructor
   * @param {String} name Name of the item
   * @param {String} kind The type of item, either "folder" or "file".
   */
  function Leaf(name, kind) {
    this.name = name;
    this.id = idCounter++; // Set id then increment counter
    this.parentID = null;
    this.kind = kind;
    this.depth = null;
    return this;
  }
  /**
   * Construct a new Leaf from an object.
   * @method  fromObject
   * @param obj
   * @static
   * @return {Leaf} The constructed Leaf.
   */
  Leaf.fromObject = function(obj) {
    var leaf = new Leaf(obj.name, obj.kind);
    return leaf;
  };

  /**
   * Convert the Leaf to SlickGrid data format
   * @method toData
   * @param  {Array} [result] The memoized result
   * @return {Object}        The leaf an item object.
   */
  Leaf.prototype.toData = function(result) {
    var item = {
      name: this.name,
      id: this.id,
      parentID: this.parentID,
      kind: this.kind,
      _node: this,
      depth: this.depth
    };
    if (result) {
      result.push(item);
    }
    return item;
  };


  ///////////
  // HGrid //
  ///////////

  /**
   * Construct an HGrid.
   *
   * @class  HGrid
   * @constructor
   * @param {String} element CSS selector for the grid.
   * @param {Object} options
   */
  function HGrid(selector, options) {
    this.element = $(selector);
    // Merge defaults with options passed in
    this.options = $.extend({}, defaults, options);
    // Can't pass both ajaxSource and data
    if (this.options.data && this.options.ajaxSource) {
      throw new HGridError('Cannot specify both "data" and "ajaxSource"');
    }
    this._defaults = defaults;
    if (this.options.data) {
      this.tree = Tree.fromObject(this.options.data.data);
      this.tree.updateDataView(); // Sync Tree with its wrapped dataview
    } else {
      this.tree = new Tree();
    }
    /**
     * The Slick.Grid object.
     * @attribute  grid
     * @type {Slick.Grid}
     */
    this.grid = null;
    this.init();
  }

  // Expose Tree and Leaf via the HGrid namespace
  HGrid.Tree = Tree;
  HGrid.Leaf = Leaf;

  HGrid.prototype.init = function() {
    this.setHeight(this.options.height)
      .setWidth(this.options.width)
      .setCSSClass(this.options.cssClass)
      ._initSlickGrid()
      ._initListeners()
      ._initDataView();
    return this;
  };

  HGrid.prototype.setHeight = function(height) {
    if (height === 'auto') {
      this.options.slickGridOptions.autoHeight = true;
    } else {
      this.element.css('height', height);
    }
    return this;
  };

  // TODO: always update column widths after setting width.
  HGrid.prototype.setWidth = function(width) {
    this.element.css('width', width);
    return this;
  };

  HGrid.prototype.setCSSClass = function(cls) {
    var self = this;
    if (Array.isArray(cls)) {
      cls.forEach(function(c) {
        self.element.addClass(c);
      });
    } else {
      self.element.addClass(cls);
    }
    return this;
  };

  /**
   * Constructs a Slick.Grid and Slick.Data.DataView from the data.
   * Sets this.grid.
   */
  HGrid.prototype._initSlickGrid = function() {
    var self = this;
    // Create the formatter function
    var formatter = makeFormatter(self.options.renderFolder, self.options.renderFile, self.options.indent);
    // Set the name column's formatter
    // TODO: Rethink this. Should the format be specified explicitly
    // instead of setting it automatically?
    var columns = self.options.columns.map(function(col) {
      if (col.id === 'name' && !('formatter' in col)) {
        col.formatter = formatter;
      }
      return col;
    });
    this.grid = new Slick.Grid(self.element.selector, this.tree.dataView,
      columns,
      self.options.slickGridOptions);
    return this;
  };

  HGrid.prototype._initListeners = function() {
    var self = this;
    this.grid.onCellChange.subscribe(function(event, args) {
      dataView.updateItem(args.item.id, args.item);
    });

    this.grid.onClick.subscribe(function(event, args) {
      // Delegate to user-defined onClick function
      var $elem = $(event.target);
      var dataView = self.grid.getData();
      var item = dataView.getItem(args.row);
      self.options.onClick(event, $elem, item, self);
    });
    return this;
  };

  /**
   * Sets up the DataView with the filter function. Must be executed after
   * initializing the Slick.Grid because the filter function needs access to the
   * data.
   */
  HGrid.prototype._initDataView = function() {
    var self = this;
    var dataView = this.getDataView();
    dataView.beginUpdate();
    // Must pass 'this' as an argument to the filter so that the filter function
    // has access to the methods
    dataView.setFilterArgs({
      thisObj: self,
      rootID: ROOT_ID
    });
    dataView.setFilter(collapseFilter);
    dataView.endUpdate();
    // wire up model events to drive the grid
    dataView.onRowCountChanged.subscribe(function(event, args) {
      self.grid.updateRowCount();
      self.grid.render();
    });

    dataView.onRowsChanged.subscribe(function(event, args) {
      self.grid.invalidateRows(args.rows);
      self.grid.render();
    });
    return this;
  };

  HGrid.prototype.destroy = function() {
    this.element.html('');
    this.grid.destroy();
  };

  /**
   * Return the data as an array.
   *
   * @method  getData
   * @return {Array} Array of data items in the DataView.
   */
  HGrid.prototype.getData = function() {
    return this.getDataView().getItems();
  };

  /**
   * Get a datum by it's ID.
   */
  HGrid.prototype.getByID = function(id) {
    var dataView = this.getDataView();
    return dataView.getItemById(id);
  };

  /**
   * Return the grid's underlying DataView.
   * @method  getDataView
   * @return {Slick.Data.DataView}
   */
  HGrid.prototype.getDataView = function() {
    return this.grid.getData();
  };

  HGrid.prototype.expandItem = function(item) {
    item._collapsed = false;
    this.getDataView().updateItem(item.id, item);
    return this;
  };


  HGrid.prototype.collapseItem = function(item) {
    item._collapsed = true;
    var dataView = this.getDataView();
    dataView.updateItem(item.id, item);
    return this;
  };

  HGrid.prototype.isCollapsed = function(item) {
    return item._collapsed;
  };

  /**
   * Add an item to the grid.
   * @method  addItem
   * @param {Object} item Object with `name`, `kind`, and `parentID`.
   *                      Must have parentID.
   *                      Example:
   *                      `{name: 'New Folder', kind: 'folder', parentID: 123}`
   * @return {Object} The added item.
   */
  HGrid.prototype.addItem = function(item, suspend) {
    var newItem = $.extend(true, {}, item); // copy the item
    var dataView = this.getDataView();
    var parent = this.getByID(newItem.parentID);
    var insertIndex;
    if (parent) {
      insertIndex = dataView.getIdxById(parent.id) + 1;
      newItem.depth = parent.depth + 1;
    } else { // Parent may be null
      insertIndex = 0;
      newItem.depth = 1;
    }
    // Set id and depth
    newItem.id = idCounter++; // set and increment
    if (suspend) {
      this.getDataView().beginUpdate(); // Prevent refresh
    }
    dataView.insertItem(insertIndex, newItem);
    this.options.onAdd(newItem, this);
    return newItem;
  };

  /**
   * Add multiple items.
   *
   * Only one refresh is made to the grid after adding all the items.
   * @param {Array} items Array of items with "name", "kind", and "parentID".
   * @param {Boolean} suspend Don't refresh the DataView after inserting the items
   */
  HGrid.prototype.addItems = function(items, suspend) {
    for (var i = 0, len = items.length - 1; i < len; i++) {
      var item = items[i];
      this.addItem(item, true); // Suspend refresh
    }
    if (!suspend) {
      this.getDataView().endUpdate();
    }
    return this;
  };

  /**
   * Remove a data item by id.
   * @method  removeItem
   * @param  {Number} id ID of the datum to remove.
   * @return {Object}    The removed item
   */
  HGrid.prototype.removeItem = function(id) {
    var item = this.getByID(id);
    this.getDataView().deleteItem(id);
    return item;
  };

  /**
   * Return a HGrid.Tree or HGrid.Leaf node given an id.
   * @param {Number} id
   * @return {HGrid.Tree} The Tree with the id.
   */
  HGrid.prototype.getNodeByID = function(id) {
    var item = this.getByID(id);
    return item._node;
  };

  /**
   * Toggle an item's collapsed/expanded state.
   * @method  toggleCollapse
   * @param  {item} item A folder item
   */
  HGrid.prototype.toggleCollapse = function(item) {
    if (item) {
      if (this.isCollapsed(item)) {
        this.expandItem(item);
      } else {
        this.collapseItem(item);
      }
    }
    return this;
  };

  // Expose collapse filter for testing purposes
  HGrid.prototype._collapseFilter = collapseFilter;
})(jQuery, window, document);
