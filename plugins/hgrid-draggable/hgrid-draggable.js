(function (global, factory) {
  if (typeof define === 'function' && define.amd) {  // AMD/RequireJS
    define(['jquery', 'hgrid'], factory);
  } else if (typeof module === 'object') {  // CommonJS/Node
    module.exports = factory(jQuery, HGrid);
  } else {  // No module system
    factory(jQuery, HGrid);
  }
}(this, function(jQuery, HGrid) {

    function Draggable(options) {

    }

    Draggable.prototype.init = function() {

    };

    HGrid.Draggable = Draggable;
    return Draggable;
}));
