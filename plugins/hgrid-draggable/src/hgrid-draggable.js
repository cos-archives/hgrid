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

    onDrop: function(event, items, folder) {},
    onDrag: function(event, items) {},
    acceptDrop: function(item, folder, done) {},
    canDrag: function(item) {
      if (item.kind === HGrid.FOLDER) {
        return false;
      }
      return true;
    },

    canAcceptDrop: function(folder) {},

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
    self.options = $.extend({}, defaults, options);
    self.rowMoveManager = null;  // Initialized in init
    // The current drag target
    self._folderTarget = null;
  }

  Draggable.prototype.setTarget = function(folder) {
    this._folderTarget = folder;
  };

  // Initialization function called by HGrid#registerPlugin
  Draggable.prototype.init = function(grid) {
    var self = this;
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

    var onBeforeMoveRows = function(event, data) {
      // Prevent moving row before or after itself
      for (var i = 0; i < data.rows.length; i++) {
        if (data.rows[i] === data.insertBefore || data.rows[i] === data.insertBefore - 1) {
          event.stopPropagation();
          grid.removeHighlight();
          return false;
        }
      }
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

      var movedItems = args.items;
      var errorFunc = function(error){
        if (error) {
          throw new HGrid.Error(error);
        }
      };

      for (var i = 0, item; item = movedItems[i]; i++) {
        self.options.acceptDrop.call(self, item, self._folderTarget, errorFunc);
      }

      // ID of the folder to transfer the items to
      var parentID = self._folderTarget.id;
      // Copy the moved items, but change the parentID to the target folder's ID
      var newItems = movedItems.map(function(item) {
        var newItem = $.extend({}, item);
        newItem.parentID = parentID;
        // remove depth and _node properties
        // these will be set upon adding the item to the grid
        delete newItem.depth;
        delete newItem._node;
        return newItem;
      });

      // Remove dragged items from grid
      for (var i = 0, item; item = movedItems[i]; i++) {
        grid.removeItem(item.id);
      }
      // Add items at new location
      grid.addItems(newItems);

      slickgrid.resetActiveCell();
      slickgrid.setSelectedRows([]);
      slickgrid.render();
      // invoke user-defined callback
      self.options.onDrop.call(self, event, movedItems, self._folderTarget);
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
      var prev = dataView.getItemByIdx(index - 1);
      if (prev.kind === HGrid.FOLDER) {
        parent = prev;
      } else{  // The item being dragged over is an item; get it's parent folder
        var insertItem = dataView.getItemByIdx(index);
        parent = grid.getByID(insertItem.parentID);
      }
      return parent;
    };

    var onDragRows = function(event, args) {
      // set the current drag target
      var movedItems = args.items;
      // get the parent of the current item being dragged over
      var parent;
      if (args.insertBefore) {
        parent = getParent(args.insertBefore);
        // Check if folder can accep drop
        // NOTE: canAccept must return false to disallow dropping, not just a falsy value
        if (self.options.canAcceptDrop.call(self, parent) === false) {
          return false;
        }
        // set the folder target
        if (parent) {
          self.setTarget(parent);
          grid.addHighlight(self._folderTarget);
        }
      }
      self.options.onDrag.call(self, event, args.items, parent);
    };

    // TODO: test that this works
    var canDrag = function(item) {
      // invoke user-defined function
      return self.options.canDrag.call(this, item);
    };

    self.rowMoveManager.onBeforeMoveRows.subscribe(onBeforeMoveRows);
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
