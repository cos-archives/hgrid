/* jshint ignore:start */
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {  // AMD/requirejs
    define(['jquery'], factory);
  } else {  // No module system
    // HGrid will be bound to global object within the factory
    factory(jQuery);
  }
}(this, function(jQuery) {
    var module = {exports: {}};  // Fake component module
/* jshint ignore:end */
