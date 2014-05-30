var defaults = {

};

function Draggable(options) {
  var self = this;
  self.options = $.extend({}, defaults, options);

}

Draggable.prototype.init = function(grid) {

};

HGrid.Draggable = Draggable;
