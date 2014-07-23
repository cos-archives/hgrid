/**
 * hgrid-draggable - Drag and drop support for HGrid
 */
this.Draggable = (function($, HGrid) {
  'use strict';

  /**
   * Default options for the Slick.RowMoveManager constructor
   * @type {Object}
   */
  var rowMoveManagerDefaults = {
    cancelEditOnDrag: true
  };

  /**
   * Default options for Draggable constructor
   * @type {Object}
   */
  var defaults = {
    /*jshint unused: false */

    onDrop: function(event, items, folder, insertBefore) {},
    onDrag: function(event, items, insertBefore) {},
    onBeforeDrag: function(event, items, insertBefore) {},
    onBeforeDrop: function(event, items, insertBefore) {},
    acceptDrop: function(item, folder, done) {},
    /**
     * Callback that is invoked if acceptDrop's done callback is called with
     * a string message, indicating that a drop has failed. By default, just
     * raises an HGrid.Error.
     */
    dropError: function(items, folder, message) {
      throw new HGrid.Error(message);
    },
    canDrag: function(item) {
      // disable dragging folder's for now
      if (item.kind === HGrid.FOLDER) {
        return false;
      }
      return true;
    },
    /**
     * Return false if folder should not be allowed as a drop target.
     * The folder will not be highlighted when being dragged over.
     * @param {Array[Object]} items The items being moved.
     * @param  {Object} folder The folder object
     */
    canAcceptDrop: function(items, folder) {},
    enableMove: true,

    // Additional options passed to the HGrid.RowMoveManager constructor
    rowMoveManagerOptions: {},
    // Additional options passed to the HGrid.RowSelectionModel constructor
    rowSelectionModelOptions: {}
  };

  /** Public interface **/

  /**
   * Constructor for the HGrid.Draggable plugin.
   *
   * NOTE: This should NOT invoke the `init` method because `init` will be invoked
   * when HGrid#registerPlugin is called.
   */
  function Draggable(options) {
    var self = this;
    self.grid = null;  // set upon calling Draggable.init
    self.options = $.extend({}, defaults, options);
    self.rowMoveManager = null;  // Initialized in init
    // The current drag target
    self._folderTarget = null;
  }

  Draggable.prototype.setTarget = function(folder) {
    this._folderTarget = folder;
  };


  Draggable.prototype.clearTarget = function() {
    this._folderTarget = null;
  };

  // Initialization function called by HGrid#registerPlugin
  Draggable.prototype.init = function(grid) {
    var self = this;
    self.grid = grid;
    var data = grid.getData();
    var dataView = grid.getDataView();
    var slickgrid = grid.grid;

    // Set selection model
    var rowSelectionModelOptions = self.options.rowSelectionModelOptions;
    slickgrid.setSelectionModel(new HGrid.RowSelectionModel(rowSelectionModelOptions));

    // Configure the RowMoveManager
    var rowMoveManagerOptions = $.extend(
      {}, rowMoveManagerDefaults, self.options.rowMoveManagerOptions
    );
    self.rowMoveManager = new HGrid.RowMoveManager(rowMoveManagerOptions);

    /** Callbacks **/

    var onBeforeDragRows = function(event, data) {
      var movedItems = data.items;
      var insertBefore = data.insertBefore;
      return self.options.onBeforeDrag.call(self, event, movedItems, insertBefore);
    };

    /**
     * Callback executed when rows are moved and dropped into a new location
     * on the grid.
     * @param  {Event} event
     * @param  {Object} args  Object containing information about the event,
     *                        including insertBefore.
     */
    var onMoveRows = function (event, args) {
      grid.removeHighlight();
      var extractedRows = [];
      // indices of the rows to move
      var indices = args.rows;
      var insertBefore = args.insertBefore;

      var movedItems = args.items;
      var i, item;

      // This function factory is to avoid creating function outside of loop context
      var makeErrorFunc = function(item, folder) {
        return function(message) {
          if (message) {
            return self.options.dropError.call(self, item, self._folderTarget, message);
          }
        };
      };

      for (i = 0, item = null; item = movedItems[i]; i++) {
        var errorFunc = makeErrorFunc(item, self._folderTarget);
        self.options.acceptDrop.call(self, item, self._folderTarget, errorFunc);
      }


      var beforeDrop = self.options.onBeforeDrop.call(self, event, movedItems, self._folderTarget, insertBefore);
      // If user-defined callback returns false, return early
      if (beforeDrop === false) {
        return false;
      }

      var newItems;
      // ID of the folder to transfer the items to
      if (self._folderTarget) {
        var parentID = self._folderTarget.id;
        // Copy the moved items, but change the parentID to the target folder's ID
        newItems = movedItems.map(function(item) {
          var newItem = $.extend({}, item);
          newItem.parentID = parentID;
          // remove depth and _node properties
          // these will be set upon adding the item to the grid
          delete newItem.depth;
          delete newItem._node;
          return newItem;
        });
      } else{
        newItems = [];
      }

      if (self.options.enableMove) {
        // Remove dragged items from grid
        for (i = 0, item = null; item = movedItems[i]; i++) {
          grid.removeItem(item.id);
        }
        // Add items at new location
        grid.addItems(newItems);

        slickgrid.resetActiveCell();
        slickgrid.setSelectedRows([]);
        slickgrid.render();
      }
      // invoke user-defined callback
      self.options.onDrop.call(self, event, movedItems, self._folderTarget, insertBefore);
    };

    var onDragStart = function(event, dd) {
      var cell = slickgrid.getCellFromEvent(event);
      if (!cell) {
        return;
      }

      dd.row = cell.row;
      if (!data[dd.row]) {
        return;
      }

      if (Slick.GlobalEditorLock.isActive()) {
        return;
      }

      event.stopImmediatePropagation();

      var selectedRows = slickgrid.getSelectedRows();

      if (!selectedRows.length || $.inArray(dd.row, selectedRows) === -1) {
        selectedRows = [dd.row];
        slickgrid.setSelectedRows(selectedRows);
      }

      dd.rows = selectedRows;
      dd.count = selectedRows.length;
    };


 /**
     * Given an index, return the correct parent folder to insert an item into.
     * @param  {Number} index
     * @return {Object}     Parent folder object or null
     */
    var getParent = function(index) {
      // First check if the dragged over item is an empty folder
      var prev = grid.grid.getDataItem(index - 1);
      var parent;
      if (prev.kind === HGrid.FOLDER) {
        parent = prev;
      } else{  // The item being dragged over is an item; get it's parent folder
        var nItems = dataView.getLength();
        var idx = index > nItems - 1 ? nItems - 1 : index;
        var insertItem = grid.grid.getDataItem(idx);
        parent = grid.getByID(insertItem.parentID);
      }
      return parent;
    };

    var onDragRows = function(event, args) {
      // set the current drag target
      var movedItems = args.items;
      var insertBefore = args.insertBefore;
      // get the parent of the current item being dragged over
      var parent;
      if (args.insertBefore) {
        parent = getParent(args.insertBefore);

        for (var i=0; i < movedItems.length; i++) {
          var node = movedItems[i]._node;
          // Can't drag folder into itself
          if (node.id === parent.id) {
            self.clearTarget();
            grid.removeHighlight();
            return false;
          }

          // Prevent dragging parent folders into descendant folder
          if (node.children) {
            for (var j=0; j < node.children.length; j++) {
              var child = node.children[j];
              if (parent.id === child.id) {
                self.clearTarget();
                grid.removeHighlight();
                return false;
              }
            }
          }
        }

        // Check if folder can accept drop
        // NOTE: canAccept must return false to disallow dropping, not just a falsy value
        if (self.options.canAcceptDrop.call(self, movedItems, parent) === false) {
          self.clearTarget();
          grid.removeHighlight();
          return false;
        }
        // set the folder target
        if (parent) {
          self.setTarget(parent);
          grid.addHighlight(self._folderTarget);
        }
      }
      self.options.onDrag.call(self, event, args.items, parent, insertBefore);
    };

    // TODO: test that this works
    var canDrag = function(item) {
      // invoke user-defined function
      return self.options.canDrag.call(self, item);
    };

    self.rowMoveManager.onBeforeDragRows.subscribe(onBeforeDragRows);
    self.rowMoveManager.onMoveRows.subscribe(onMoveRows);
    self.rowMoveManager.onDragRows.subscribe(onDragRows);
    self.rowMoveManager.canDrag = canDrag;

    // Register the slickgrid plugin
    slickgrid.registerPlugin(self.rowMoveManager);

    slickgrid.onDragInit.subscribe(function(event) {
      // prevent grid from cancelling drag'n'drop by default
      event.stopImmediatePropagation;
    });

    slickgrid.onDragStart.subscribe(onDragStart);
  };


  Draggable.prototype.destroy = function() {
    this.rowMoveManager.destroy();
    HGrid.Col.Name.behavior = null;
  };

  HGrid.Draggable = Draggable;
  return Draggable;
}).call(this, jQuery, HGrid);
