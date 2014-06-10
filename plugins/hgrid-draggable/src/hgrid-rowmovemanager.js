/**
 * Customized row move manager, modified from slickgrid's rowmovemanger.js (MIT Licensed)
 * https://github.com/mleibman/SlickGrid/blob/master/plugins/slick.rowmovemanager.js
 */
(function ($, HGrid) {
  'use strict';
  function RowMoveManager(options) {
    var _grid;
    var _canvas;
    var _dragging;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {
      cancelEditOnDrag: false,
      enableReorder: false, // TODO(sloria): reordering not implemented yet.
                            // Setting to false will disable the reorder guide.
      proxyClass: 'slick-reorder-proxy',
      guideClass: 'slick-reorder-guide'
    };

    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _canvas = _grid.getCanvasNode();
      _handler
        .subscribe(_grid.onDragInit, handleDragInit)
        .subscribe(_grid.onDragStart, handleDragStart)
        .subscribe(_grid.onDrag, handleDrag)
        .subscribe(_grid.onDragEnd, handleDragEnd);
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    function handleDragInit(e) {
      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e, dd) {
      var cell = _grid.getCellFromEvent(e);

      if (options.cancelEditOnDrag && _grid.getEditorLock().isActive()) {
        _grid.getEditorLock().cancelCurrentEdit();
      }

      if (_grid.getEditorLock().isActive() || !/move|selectAndMove/.test(_grid.getColumns()[cell.cell].behavior)) {
        return false;
      }

      _dragging = true;
      e.stopImmediatePropagation();

      var selectedRows = _grid.getSelectedRows();

      if (selectedRows.length === 0 || $.inArray(cell.row, selectedRows) === -1) {
        selectedRows = [cell.row];
        _grid.setSelectedRows(selectedRows);
      }

      var rowHeight = _grid.getOptions().rowHeight;

      dd.selectedRows = selectedRows;

      var movedItems = dd.selectedRows.map(function(rowIdx) {
        return _grid.getData().getItemByIdx(rowIdx);
      });

      for (var i = 0, item; item = movedItems[i]; i++) {
        if (_self.canDrag(item) === false) {
          return false;
        }
      }

      dd.selectionProxy = $('<div class="' + options.proxyClass + '"/>')
          .css('position', 'absolute')
          .css('zIndex', '99999')
          .css('width', $(_canvas).innerWidth())
          .css('height', rowHeight * selectedRows.length)
          .appendTo(_canvas);

      if (options.enableReorder) {
        dd.guide = $('<div class="' + options.guideClass + '"/>')
            .css('position', 'absolute')
            .css('zIndex', '99998')
            .css('width', $(_canvas).innerWidth())
            .css('top', -1000)
            .appendTo(_canvas);
      }

      dd.insertBefore = -1;

      _self.onDragRowsStart.notify({
        rows: dd.selectedRows,
        items: movedItems
      });
    }

    function handleDrag(e, dd) {
      if (!_dragging) {
        return;
      }

      e.stopImmediatePropagation();

      var top = e.pageY - $(_canvas).offset().top;
      dd.selectionProxy.css('top', top - 5);

      var insertBefore = Math.max(0, Math.min(Math.round(top / _grid.getOptions().rowHeight), _grid.getDataLength()));

      // The moved data items
      var movedItems = dd.selectedRows.map(function(rowIdx) {
        return _grid.getData().getItemByIdx(rowIdx);
      });
      dd.movedItems = movedItems;

      if (insertBefore !== dd.insertBefore) {
        var eventData = {
          rows: dd.selectedRows,
          insertBefore: insertBefore,
          items: dd.movedItems
        };

        if (_self.onBeforeMoveRows.notify(eventData) === false) {
          if (options.enableReorder) {
            dd.guide.css('top', -1000);
          }
          dd.canMove = false;
        } else {
          if (options.enableReorder) {
            dd.guide.css('top', insertBefore * _grid.getOptions().rowHeight);
          }
          dd.canMove = true;
        }

        dd.insertBefore = insertBefore;
      }

      _self.onDragRows.notify({
        rows: dd.selectedRows,
        insertBefore: dd.insertBefore,
        items: movedItems
      });
    }

    function handleDragEnd(e, dd) {
      if (!_dragging) {
        return;
      }
      _dragging = false;
      e.stopImmediatePropagation();

      if (options.enableReorder) {
        dd.guide.remove();
      }
      dd.selectionProxy.remove();

      if (dd.canMove) {
        var eventData = {
          'rows': dd.selectedRows,
          'items': dd.movedItems,
          'insertBefore': dd.insertBefore
        };
        // TODO:  _grid.remapCellCssClasses ?
        _self.onMoveRows.notify(eventData);
      }
    }

    $.extend(this, {
      'onDragRowsStart': new Slick.Event(),
      'onBeforeMoveRows': new Slick.Event(),
      'onMoveRows': new Slick.Event(),
      'onDragRows': new Slick.Event(),
      /*jshint unused:false */
      'canDrag': function(item) { return true; },
      'init': init,
      'destroy': destroy
    });
  }

  HGrid.RowMoveManager = RowMoveManager;
})(jQuery, HGrid);
