(function (global, factory) {
  if (typeof define === 'function' && define.amd) {  // AMD/requirejs
    define(['jquery'], factory);
  } else {  // No module system
    global.HGrid = factory(jQuery);
  }
}(this, function(jQuery) {
var module = typeof module === 'object' ? module : {exports: {}};
