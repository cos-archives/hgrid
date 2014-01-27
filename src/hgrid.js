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
   * @class  makeFormatter
   * @private
   * @param  {Function} folderFunc Function that returns the HTML for a folder.
   * @param  {Function} fileFunc   Function that returns the HTML for a file.
   * @return {Function}            A SlickGrid formatter function, used by Slick.Data.DataView
   *                                 to render the folder and file display text.
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
   * @class  collapseFilter
   * @private
   * @returns {Boolean} Whether to display the item or not.
   */
  function collapseFilter(item) {
    return !item._hidden;
  }

  function canToggle($elem) {
    return $elem.hasClass('toggle');
  }

  HGrid.COL_NAME = {
    id: 'name',
    name: 'Name',
    field: 'name',
    cssClass: 'cell-title',
    defaultSortAsc: true
  };

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
    /**
     * Enable uploads (requires DropZone)
     * @property [uploads]
     * @type {Boolean}
     */
    uploads: false,
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
    columns: [HGrid.COL_NAME],
    // dropZonePreviewsContainer: null,
    // dropzoneOptions: null,
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
     * @property [cssClass]
     */
    cssClass: 'hgrid',
    /**
     * CSS class applied for a highlighted row.
     * @property [highlightClass]
     * @type {String}
     */
    highlightClass: 'hg-row-highlight',
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
      // Placeholder for error messages
      var errorElem = '<span class="error" data-upload-errormessage></span>';
      // The + / - button for expanding/collapsing a folder
      var expander = item._collapsed ? '<span class="toggle expand"></span>' :
        '<span class="toggle collapse"></span>';
      // The folder icon
      var folderIcon = ' <span class="hg-folder"></span>';
      // Concatenate the expander, folder icon, and the folder name
      return [expander, folderIcon, errorElem, name].join(' ');
    },
    /**
     * Render a file to HTML.
     * @property renderFile
     * @param  {Object} item The file as an item object.
     * @return {String}      HTML for the file.
     */
    renderFile: function(item) {
      var fileIcon = '<span class="hg-file"></span>';
      // Placeholder for error messages
      var errorElem = '<span class="error" data-upload-errormessage></span>';
      // Placeholder for progress bar
      var progressElem = '<span class="hg-upload" data-upload-progress></span>';
      return [fileIcon, sanitized(item.name), progressElem, errorElem].join(' ');
    },
    /**
     * Additional options passed to Slick.Grid constructor
     * See: https://github.com/mleibman/SlickGrid/wiki/Grid-Options
     * @property [slickgridOptions]
     */
    slickgridOptions: {
      editable: false,
      asyncEditorLoading: false,
      enableCellNavigation: false,
      enableColumnReorder: false, // column reordering requires jquery-ui.sortable
      forceFitColumns: true
    },
    /**
     * URL to send upload requests to. Can be either a string of a function
     * that receives a data item.
     * Example:
     *  uploadUrl: function(item) {return '/upload/' + item.id; }
     * @property [uploadUrl]
     */
    uploadUrl: null,
    /**
     * Array of accepted file types. Can be file extensions or mimetypes.
     * Example: `['.py', 'application/pdf', 'image/*']
     * @property [acceptedFiles]
     * @type {Array}
     */
    acceptedFiles: null,
    /**
     * Max filesize in Mb.
     * @property [maxFilesize]
     */
    maxFilesize: 256,
    /**
     * HTTP method to use for uploading.
     */
    // TODO: allow this to be a function that receives an item
    uploadMethod: 'POST',
    /**
     * Additional options passed to DropZone constructor
     * See: http://www.dropzonejs.com/
     * @property [dropzoneOptions]
     * @type {Object}
     */
    dropzoneOptions: {},
    /**
     * Callback function executed after an item is clicked.
     * By default, expand or collapse the item.
     * @property [onClick]
     */
    onClick: function(event, element, item) {
      // var then = new Date();
      if (canToggle(element)) {
        this.toggleCollapse(item);
      }
      event.stopImmediatePropagation();
      // console.log(new Date() - then);
    },
    /**
     * Callback executed after an item is added.
     * @property [onItemAdded]
     */
    /*jshint unused: false */
    onItemAdded: function(item) {},
    // Dragging related callbacks
    /*jshint unused: false */
    onDragover: function(evt, item) {},
    /*jshint unused: false */
    onDragenter: function(evt, item) {},
    /**
     * Called whenever an upload error occur
     * @property [uploadError]
     * @param  {Object} file    The HTML file object
     * @param {String} message Error message
     * @param {Object} item The placeholder item that was added to the grid for the file.
     */
    /*jshint unused: false */
    uploadError: function(file, message, item) {
      // The row element for the added file is stored on the file object
      var $rowElem = $(file.gridElement);
      $rowElem.addClass('hg-upload-error');
      var msg;
      if (typeof message !== 'string' && message.error) {
        msg = message.error;
      } else {
        msg = message;
      }
      // Show error message in any element within the row
      // that contains 'data-upload-errormessage'
      $rowElem.find('[data-upload-errormessage]').each(function(i) {
        this.textContent = msg;
      });
      return this;
    },
    uploadProgress: function(file, progress, bytesSent, item) {
      var $row = $(file.gridElement);
      $row.find('[data-upload-progress]').each(function(i) {
        this.textContent = progress + '%';
      });
    },
    /**
     * Additional initialization. Useful for adding listeners.
     * @property {Function} init
     */
    init: function() {}
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
   * var subtree = new Tree({name: 'A subtree', kind: 'folder'});
   * root.add(subtree);
   * subtree.depth  // => 1
   * ```
   *
   * @class HGrid.Tree
   * @constructor
   * @param {Object} data Data to attach to the tree
   */
  function Tree(data) {
    if (data === undefined) { // No args passed, it's a root
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
      this.data = data;
      if (data.id) {
        this.id = data.id;
      } else {
        this.id = idCounter++; // set id then increment counter
      }
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
   * Example input:
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
      children = data.children || [];
      tree = new Tree(data);
      tree.depth = parent.depth + 1;
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
   * Get the tree's corresponding item object from the dataview.
   * @method  getItem
   */
  Tree.prototype.getItem = function() {
    return this.dataView.getItemById(this.id);
  };

  /**
   * Computes the index in the DataView where to insert an item, based on
   * the item's parentID property.
   * @private
   */
  function computeAddIdx(item, dataView) {
    var parent = dataView.getItemById(item.parentID);
    if (parent) {
      return dataView.getIdxById(parent.id) + 1;
    }
    return 0;
  }

  Tree.prototype.insertIntoDataView = function(component) {
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
  };

  Tree.prototype.ensureDataView = function(dataView) {
    if (!dataView) {
      dataView = this.dataView;
    }
    this.dataView = dataView;
    for (var i = 0, node; node = this.children[i]; i++) {
      node.ensureDataView(dataView);
    }
    return this;
  };

  /**
   * Update the dataview with this tree's data. This should only be called on
   * a root node.
   */
  Tree.prototype.updateDataView = function() {
    if (!this.dataView) {
      throw new HGridError('Tree does not have a DataView. updateDataView must be called on a root node.');
    }
    this.ensureDataView();
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
      var thisItem = $.extend({}, {
        id: this.id,
        parentID: this.parentID,
        _node: this,
        depth: this.depth
      }, this.data);
      data.push(thisItem);
    }
    for (var i = 0, len = this.children.length; i < len; i++) {
      var child = this.children[i];
      child.toData(data);
    }
    return data;
  };

  /**
   * Collapse this and all children nodes, by setting the _collapsed attribute
   * @method  collapse
   * @param {Boolean} hideSelf Whether to hide this node as well
   */
  Tree.prototype.collapse = function(hideSelf) {
    var item = this.getItem();
    // A node can be collapsed but not hidden. For example, if you click
    // on a folder, it should collapse and hide all of its contents, but the folder
    // should still be visible.
    if (hideSelf) {
      item._hidden = true;
    } else {
      item._collapsed = true;
      item._hidden = false;
    }
    // Collapse and hide all children
    for (var i = 0, node; node = this.children[i]; i++) {
      node.collapse(true);
    }
    return this;
  };

  /**
   * Expand this and all children nodes by setting the item's _collapsed attribute
   * @method  expand
   */
  Tree.prototype.expand = function(notFirst) {
    var item = this.getItem();
    if (!notFirst) {
      item._collapsed = false;
    }
    item._hidden = false;
    // Expand all children
    for (var i = 0, node; node = this.children[i]; i++) {
      if (!item._collapsed) { // Maintain subtree's collapsed state
        node.expand(true);
      }
    }
    return this;
  };

  /**
   * @method isCollapsed
   * @return {Boolean} Whether the node is collapsed.
   */
  Tree.prototype.isCollapsed = function() {
    return this.getItem()._collapsed;
  };

  /**
   * Leaf representation
   * @class  HGrid.Leaf
   * @constructor
   */
  function Leaf(data) {
    this.data = data;
    if (data.id) {
      this.id = data.id;
    } else {
      this.id = idCounter++; // Set id then increment counter
    }
    this.parentID = null; // Set by parent
    this.depth = null;
    this.children = [];
    this.dataView = null; // Set by parent
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
    var leaf = new Leaf(obj);
    return leaf;
  };

  /**
   * Get the leaf's corresponding item from the dataview.
   * @method  getItem
   */
  Leaf.prototype.getItem = function() {
    return this.dataView.getItemById(this.id);
  };

  /**
   * Collapse this leaf by setting its item's _collapsed property.
   * @method  collapse
   */
  Leaf.prototype.collapse = function() {
    var item = this.getItem();
    item._collapsed = item._hidden = true;
    return this;
  };

  /**
   * Expand this leaf by setting its item's _collapse property
   * @method  expand
   */
  Leaf.prototype.expand = function() {
    var item = this.getItem();
    item._collapsed = item._hidden = false;
    return this;
  };

  /**
   * Convert the Leaf to SlickGrid data format
   * @method toData
   * @param  {Array} [result] The memoized result
   * @return {Object}        The leaf an item object.
   */
  Leaf.prototype.toData = function(result) {
    var item = $.extend({}, {
      id: this.id,
      parentID: this.parentID,
      _node: this,
      depth: this.depth
    }, this.data);
    if (result) {
      result.push(item);
    }
    return item;
  };

  Leaf.prototype.ensureDataView = function(dataView) {
    if (!dataView) {
      dataView = this.dataView;
    }
    this.dataView = dataView;
    return this;
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
    this.selector = selector;
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
     * The Slick.Grid object. This is set upon calling init()
     * @attribute  grid
     * @type {Slick.Grid}
     */
    this.grid = null;
    /**
     * The Dropzone object. This is set upon calling init()
     * @type {Dropzone}
     */
    this.dropzone = null;
    this.init();
  }

  // Expose Tree and Leaf via the HGrid namespace
  HGrid.Tree = Tree;
  HGrid.Leaf = Leaf;

  HGrid.ROOT_ID = ROOT_ID;
  HGrid.FOLDER = FOLDER;
  HGrid.FILE = FILE;

  HGrid.prototype.init = function() {
    this.setHeight(this.options.height)
      .setWidth(this.options.width)
      .setCSSClass(this.options.cssClass)
      ._initSlickGrid()
      ._initDataView();

    if (this.options.uploads) {
      if (typeof Dropzone === 'undefined') {
        throw new HGridError('uploads=true requires DropZone to be loaded');
      }
      this._initDropzone();
    }
    // Attach the listeners last, after this.grid and this.dropzone are set
    this._initListeners();
    this.options.init.call(this);
    return this;
  };

  HGrid.prototype.setHeight = function(height) {
    if (height === 'auto') {
      this.options.slickgridOptions.autoHeight = true;
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
   * @method  _initSlickGrid
   * @private
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
      self.options.slickgridOptions);
    return this;
  };

  HGrid.prototype.removeHighlight = function() {
    this.element.find('.' + this.options.highlightClass)
      .removeClass(this.options.highlightClass);
    return this;
  };

  /**
   * Get the row element for an item, given its id.
   * @method  getRowElement
   * @return {jQuery}    The jQuery element for the grid row.
   */
  HGrid.prototype.getRowElement = function(id) {
    return this.grid.getCellNode(this.getDataView().getRowById(id), 0).parentNode;
  };

  HGrid.prototype.addHighlight = function(item) {
    this.removeHighlight();
    var $rowElement;
    if (item && item.kind === FOLDER) {
      $rowElement = $(this.getRowElement(item.id));
    } else {
      $rowElement = $(this.getRowElement(item.parentID));
    }
    if ($rowElement) {
      $rowElement.addClass(this.options.highlightClass);
    }
    return this;
  };

  /**
   * SlickGrid events that the grid subscribes to. Mostly just delegates to one
   * of the callbacks in `options`.
   * For each funcion, `this` refers to the HGrid object.
   * @attribute slickEvents
   */
  HGrid.prototype.slickEvents = {
    'onClick': function(evt, args) {
      var $elem = $(evt.target);
      var item = this.getDataView().getItem(args.row);
      this.options.onClick.call(this, event, $elem, item);
      return this;
    },

    'onCellChange': function(evt, args) {
      this.getDataView().updateItem(args.item.id, args.item);
      return this;
    },
    'onMouseLeave': function(evt, args) {
      this.removeHighlight();
    }
  };

  HGrid.prototype.getItemFromEvent = function(evt) {
    var cell = this.grid.getCellFromEvent(evt);
    if (cell) {
      return this.getDataView().getItem(cell.row);
    } else {
      return null;
    }
  };

  HGrid.prototype.currentTarget = null; // The item to upload to
  /**
   * DropZone events that the grid subscribes to.
   * For each function, `this` refers to the HGrid object.
   * @attribute  dropzoneEvents
   * @type {Object}
   */
  HGrid.prototype.dropzoneEvents = {
    drop: function(evt) {
      this.removeHighlight();
    },
    dragleave: function(evt) {
      this.removeHighlight();
    },
    // Set the current upload target upon dragging a file onto the grid
    dragenter: function(evt) {
      var item = this.getItemFromEvent(evt);
      if (item) {
        if (item.kind === FOLDER) {
          this.currentTarget = item;
        } else {
          this.currentTarget = this.getByID(item.parentID);
        }
      }
      this.options.onDragenter.call(this, evt, item);
    },
    dragover: function(evt) {
      var currentTarget = this.currentTarget;
      var item = this.getItemFromEvent(evt);
      if (currentTarget) {
        if (currentTarget.allowUploads || typeof currentTarget.allowUploads === 'undefined') {
          this.addHighlight(currentTarget);
        }
        // if upload url is a function, call it, passing in the item,
        // and set dropzone to upload to the result
        if (typeof this.options.uploadUrl === 'function') {
          this.dropzone.options.url = this.options.uploadUrl(currentTarget);
        }
      }
      this.options.onDragover.call(this, evt, item);
    },
    dragend: function(evt) {
      this.removeHighlight();
    },
    // When a file is added, set currentTarget (the folder item to upload to)
    // and bind gridElement (the html element for the added row) and gridItem
    // (the added item object) to the file object
    addedfile: function(file) {
      var currentTarget = this.currentTarget;
      // Add a new row
      var addedItem = this.addItem({
        name: file.name,
        kind: HGrid.FILE,
        parentID: currentTarget.id
      });
      var rowElem = this.getRowElement(addedItem.id),
        $rowElem = $(rowElem);
      // Save the item data and HTML element on the file object
      file.gridItem = addedItem;
      file.gridElement = rowElem;
      $rowElem.addClass('hg-upload-started');
      // TODO: Add cancel upload link to actions
      return addedItem;
    },
    thumbnail: function(file, dataUrl) {},
    // Just delegate error function to options.uploadError
    error: function(file, message) {
      return this.options.uploadError.call(this, file, message, file.gridItem);
    },
    processing: function(file) {
      $(file.gridElement).addClass('hg-upload-processing');
      // TODO: display Cancel upload button text
      return this;
    },
    uploadprogress: function(file, progress, bytesSent) {
      return this.options.uploadProgress.call(this, file, progress, bytesSent, file.gridItem);
    }
  };

  /**
   * Wires up all the event handlers.
   * @method  _initListeners
   * @private
   */
  HGrid.prototype._initListeners = function() {
    var self = this,
      callbackName, fn;
    // Wire up all the slickgrid events
    for (callbackName in self.slickEvents) {
      fn = self.slickEvents[callbackName].bind(self); // make `this` object the grid
      self.grid[callbackName].subscribe(fn);
    }

    if (this.options.uploads) {
      // Wire up all the dropzone events
      for (callbackName in self.dropzoneEvents) {
        fn = self.dropzoneEvents[callbackName].bind(self);
        self.dropzone.on(callbackName, fn);
      }
    }
    return this;
  };

  /**
   * Sets up the DataView with the filter function. Must be executed after
   * initializing the Slick.Grid because the filter function needs access to the
   * data.
   * @method  _initDataView
   * @private
   */
  HGrid.prototype._initDataView = function() {
    var self = this;
    var dataView = this.getDataView();
    dataView.beginUpdate();
    dataView.setFilter(collapseFilter);
    dataView.endUpdate();
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

  var requiredDropzoneOpts = {
    addRemoveLinks: false,
    dropDestination: null,
    uploadMultiple: false,
    previewTemplate: '<div class="dz-preview">' +
      '<div class="dz-progress"><span class="dz-upload" data-dz-uploadprogress></span></div>' +
      '</div>'
  };

  /**
   * Builds a new DropZone object and attaches it the "dropzone" attribute of
   * the grid.
   * @method  _initDropZone
   * @private
   */
  HGrid.prototype._initDropzone = function() {
    var uploadUrl;
    if (typeof this.options.uploadUrl === 'string') {
      uploadUrl = this.options.uploadUrl;
    } else { // uploadUrl is a function, so will compute the upload url dynamically
      uploadUrl = '/';
    }
    // Build up the options object, combining the HGrid options, required options,
    // and additional options
    var dropzoneOptions = $.extend({
        url: uploadUrl,
        // Dropzone expects comma separated list
        acceptedFiles: this.options.acceptedFiles ?
          this.options.acceptedFiles.join(',') : null,
        maxFilesize: this.options.maxFilesize,
        method: this.options.uploadMethod
      },
      requiredDropzoneOpts,
      this.options.dropzoneOptions);
    this.dropzone = new Dropzone(this.selector, dropzoneOptions);
    return this;
  };

  HGrid.prototype.destroy = function() {
    this.element.html('');
    this.grid.destroy();
    if (this.dropzone) {
      this.dropzone.destroy();
    }
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

  /**
   * Expand an item. Updates the dataview.
   * @method  expandItem
   * @param  {Object} item
   */
  HGrid.prototype.expandItem = function(item) {
    item._node.expand();
    var dataview = this.getDataView();
    var ignoreBefore = dataview.getRowById(item.id);
    dataview.setRefreshHints({
      isFilterNarrowing: false,
      isFilterExpanding: true,
      ignoreDiffsBefore: ignoreBefore
    });
    this.getDataView().updateItem(item.id, item);
    return this;
  };

  /**
   * Collapse an item. Updates the dataview.
   * @method  collapseItem
   * @param  {Object} item
   */
  HGrid.prototype.collapseItem = function(item) {
    item._node.collapse();
    var dataview = this.getDataView();
    var ignoreBefore = dataview.getRowById(item.id);
    dataview.setRefreshHints({
      isFilterNarrowing: true,
      isFilterExpanding: false,
      ignoreDiffsBefore: ignoreBefore
    });
    dataview.updateItem(item.id, item);
    return this;
  };

  HGrid.prototype.isCollapsed = function(item) {
    return item._collapsed;
  };

  /**
   * Add an item to the grid.
   * @method  addItem
   * @param {Object} item Object with `name`, `kind`, and `parentID`.
   *                      If parentID is not specified, the new item is added to the root node.
   *                      Example:
   *                      `{name: 'New Folder', kind: 'folder', parentID: 123}`
   * @return {Object} The added item.
   */
  HGrid.prototype.addItem = function(item) {
    var node, parentNode;
    // Create a new node for the item
    if (item.kind === HGrid.FOLDER) {
      node = new HGrid.Tree(item);
    } else {
      node = new HGrid.Leaf(item);
    }
    if (item.parentID == null) {
      parentNode = this.tree;
    } else {
      parentNode = this.getNodeByID(item.parentID);
    }
    parentNode.add(node, true);
    var newItem = this.getByID(node.id);
    this.options.onItemAdded.call(this, newItem);
    return newItem;
  };

  /**
   * Add multiple items.
   *
   * Only one refresh is made to the grid after adding all the items.
   * @param {Array} items Array of items with "name", "kind", and "parentID".
   */
  HGrid.prototype.addItems = function(items) {
    var self = this;
    this.batchUpdate(function() {
      for (var i = 0, len = items.length; i < len; i++) {
        var item = items[i];
        self.addItem(item);
      }
    });
    return this;
  };

  HGrid.prototype.batchUpdate = function(func) {
    this.getDataView().beginUpdate();
    func.call(this);
    this.getDataView().endUpdate();
  };


  /**
   * Add a new grid column
   * @method  addColumn
   * Example:
   * ```
   * grid.addColumn({id: 'size', name: 'File Size', field: 'filesize', width: 50})
   * ```
   * @param {Object} colSpec Column specification. See
   *                         https://github.com/mleibman/SlickGrid/wiki/Column-Options
   */
  HGrid.prototype.addColumn = function(colSpec) {
    var columns = this.grid.getColumns();
    columns.push(colSpec);
    this.grid.setColumns(columns);
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
   * @return {HGrid.Tree} The Tree or Leaf with the id.
   */
  HGrid.prototype.getNodeByID = function(id) {
    if (id === HGrid.ROOT_ID || id == null) {
      return this.tree;
    }
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
