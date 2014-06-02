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
    draggableNameCol: true,
    // Additional options passed to the Slick.RowMoveManager constructor
    rowMoveManagerOptions: {}
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
  }

  // Initialization function called by HGrid#registerPlugin
  Draggable.prototype.init = function(grid) {
    var self = this;
    var data = grid.getData();
    var dataView = grid.getDataView();
    var slickgrid = grid.grid;

    // Make grid's name column draggable
    if (self.options.draggableNameCol) {
      HGrid.Col.Name.behavior = 'move';
    }

    // Set selection model
    slickgrid.setSelectionModel(new HGrid.RowSelectionModel());


    // Configure the RowMoveManager
    var rowMoveManagerOptions = $.extend(
      {}, rowMoveManagerDefaults, self.options.rowMoveManagerOptions
    );
    self.rowMoveManager = new Slick.RowMoveManager(rowMoveManagerOptions);

    /** Callbacks **/

    var onBeforeMoveRows = function(event, data) {
      // Prevent moving row before or after itself
      for (var i = 0; i < data.rows.length; i++) {
        if (data.rows[i] === data.insertBefore || data.rows[i] === data.insertBefore - 1) {
          event.stopPropagation();
          return false;
        }
      }
    };

    // TODO(sloria): Test me

    /**
     * Callback executed when rows are moved and dropped into a new location
     * on the grid.
     * @param  {Event} event
     * @param  {Object} args  Object containing information about the event,
     *                        including insertBefore.
     */
    var onMoveRows = function (event, args) {
      var extractedRows = [];
      // indices of the moved rows
      var indices = args.rows;

      // The moved data items
      var movedItems = indices.map(function(rowIdx) {
        return dataView.getItemByIdx(rowIdx);
      });

      var insertBefore = args.insertBefore;
      var left = data.slice(0, insertBefore);
      var right = data.slice(insertBefore, data.length);

      indices.sort(function(a, b) { return a - b; });

      var i;
      for (i = 0; i < indices.length; i++) {
        extractedRows.push(data[indices[i]]);
      }

      indices.reverse();

      for (i = 0; i < indices.length; i++) {
        var row = indices[i];
        if (row < insertBefore) {
          left.splice(row, 1);
        } else {
          right.splice(row - insertBefore, 1);
        }
      }

      // TODO(sloria): Is there a more performant way to do this?
      var newData = left.concat(extractedRows.concat(right));

      var selectedRows = [];
      for (i = 0; i < indices.length; i++) {
        selectedRows.push(left.length + i);
      }

      slickgrid.resetActiveCell();
      dataView.setItems(newData);
      slickgrid.setSelectedRows(selectedRows);
      slickgrid.render();
    };

    var onDragStart = function(event, dd) {
      var cell = slickgrid.getCellFromEvent(e);
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

      var selectedRows = grid.getSelectedRows();

      if (!selectedRows.length || $.inArray(dd.row, selectedRows) === -1) {
        selectedRows = [dd.row];
        grid.setSelectedRows(selectedRows);
      }

      dd.rows = selectedRows;
      dd.count = selectedRows.length;
    };

    self.rowMoveManager.onBeforeMoveRows.subscribe(onBeforeMoveRows);
    self.rowMoveManager.onMoveRows.subscribe(onMoveRows);

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
