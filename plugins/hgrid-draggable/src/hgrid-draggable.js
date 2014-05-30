/**
 * hgrid-draggable - Drag and drop support for HGrid
 */

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
  var slickgrid = grid.grid;

  // Set selection model
  slickgrid.setSelectionModel(new Slick.RowSelectionModel());


  // Configure the RowMoveManager
  var rowMoveManagerOptions = $.extend(
    {}, rowMoveManagerDefaults, self.options.rowMoveManagerOptions
  );
  self.rowMoveManager = new Slick.RowMoveManager(rowMoveManagerOptions);
  self.rowMoveManager.onBeforeMoveRows.subscribe(function(event, data) {
    // Prevent moving row before or after itself
    for (var i = 0; i < data.rows.length; i++) {
      if (data.rows[i] === data.insertBefore || data.rows[i] === data.insertBefore - 1) {
        event.stopPropagation;
        return false;
      }
    }
  });
  self.rowMoveManager.onMoveRows.subscribe(function (event, args) {
    var extractedRows = [];
    var rows = args.rows;
    var insertBefore = args.insertBefore;
    var left = data.slice(0, insertBefore);
    var right = data.slice(insertBefore, data.length);

    rows.sort(function(a, b) { return a - b; });

    var i;
    for (i = 0; i < rows.length; i++) {
      extractedRows.push(data[rows[i]]);
    }

    rows.reverse();

    for (i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row < insertBefore) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBefore, 1);
      }
    }


    data = left.concat(extractedRows.concat(right));

    var selectedRows = [];
    for (i = 0; i < rows.length; i++) {
      selectedRows.push(left.length + i);
    }


    slickgrid.resetActiveCell();
    slickgrid.setData(data);
    slickgrid.setSelectedRows(selectedRows);
    slickgrid.render();

  });

  // Register the slickgrid plugin
  slickgrid.registerPlugin(self.rowMoveManager);

  slickgrid.onDragInit.subscribe(function(event) {
    // prevent grid from cancelling drag'n'drop by default
    event.stopImmediatePropagation;
  });

  slickgrid.onDragStart.subscribe(function(event, dd) {
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
  });

};

HGrid.Draggable = Draggable;
