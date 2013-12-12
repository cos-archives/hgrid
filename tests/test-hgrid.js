
(function($){
    "use strict";

    var data, myGrid;

    module("Hgrid", {
        setup: function(){
            data = [
                {'uid': 0, 'type': 'folder', 'name': 'skaters', 'parent_uid': 'null'},
                {'uid': 3, 'type': 'folder', 'name': 'soccer_players', 'parent_uid': 'null'},
                {'uid': 4, 'type': 'folder', 'name': 'pro', 'parent_uid': 3},
                {'uid': 7, 'type': 'folder', 'name': 'regular', 'parent_uid': 3},
                {'uid': 10, 'type': 'folder', 'name': 'bad', 'parent_uid': 7},
                {'uid': 1, 'type': 'file', 'name': 'tony', 'parent_uid': 0},
                {'uid': 2, 'type': 'file', 'name': 'bucky', 'parent_uid': 0},
                {'uid': 5, 'type': 'file', 'name': 'ronaldo', 'parent_uid': 4},
                {'uid': 6, 'type': 'file', 'name': 'messi', 'parent_uid': 4},
                {'uid': 8, 'type': 'file', 'name': 'jake', 'parent_uid': 7},
                {'uid': 9, 'type': 'file', 'name': 'robert', 'parent_uid': 7},
                {'uid': 11, 'type': 'file', 'name': 'joe', 'parent_uid': 10}
            ];
            myGrid = HGrid.create({
                container: "#myGrid",
                info: data,
                breadcrumbBox: "#myGridBreadcrumbs",
                dropZone: true,
                url: '/',
            });
        }

    });

    test( "Create", function() {
        ok(myGrid);
    });

    test( "Data Length in Grid", function(){
        equal(myGrid.data.length, data.length);
    });

    test("requiredFieldValidator", function(){
        // Custom assertion for the method
        function valid(value, expected, msg){
            equal(myGrid.requiredFieldValidator(value).valid, expected, msg);
        }
        valid(1, true, "1 is valid");
        valid(0, true, "0 is valid");
        valid('foo', true, "string is valid");
        valid(null, false, "null is invalid");
        valid(undefined, false, "undefined is invalid");
        valid('', false, "empty string is invalid");
        valid([], false, "empty array is invalid");
        valid({}, false, "empty object is invalid");
    });

    test("All urls default to grid.url", function(){
        var urls = ['urlAdd','urlMove','urlEdit','urlDelete'];
        for (var i = urls.length - 1; i >= 0; i--) {
            equal(myGrid.options[urls[i]], myGrid.options.url);
        };
    });

    test("defaultTaskNameFormatter returns collapsible span", function(){
        var ret = myGrid.defaultTaskNameFormatter(0, 0, "Sort", null,
                                                {'uid': 0, 'type': 'folder', 'name': 'skaters', 'parent_uid': 'null'});
        var $elem = $(ret);
        var collapsible = $elem.eq(2).hasClass("collapse");  // Second span element has collapse class
        equal(collapsible, true);
        var ret = myGrid.defaultTaskNameFormatter(0, 0, "Sort", null,
                                                {'uid': 0, 'type': 'folder', 'name': 'skaters',
                                                'parent_uid': 'null', "_collapsed": true});
        var $elem = $(ret);
        var expandable = $elem.eq(2).hasClass("expand");
        equal(expandable, true);
    });


    test("Grid has dropzone object", function() {
        ok(myGrid.dropZoneObj);
    });

    test("addColumn", function() {
        ok(myGrid.addColumn({id:'id', name:'id', field:'id'}));
    });
})(jQuery);
