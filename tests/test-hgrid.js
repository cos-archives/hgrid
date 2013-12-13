
(function($){
    "use strict";

    var data, myGrid;

    module("Basic", {
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
            var invalid = {valid: false, msg: "This is a required field"};
            var valid = {valid: true, msg: null}
            if (expected) {
                deepEqual(myGrid.requiredFieldValidator(value), valid, msg);
            } else {
                deepEqual(myGrid.requiredFieldValidator(value), invalid, msg);
            };
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

    test("defaultTaskNameFormatter is collapsible", function(){
        var ret = myGrid.defaultTaskNameFormatter(0, 0, "Sort", null,
                                                {'uid': 2, 'type': 'folder', 'name': 'skaters', 'parent_uid': 'null'});
        var $elem = $(ret).eq(2);
        var collapsible = $elem.hasClass("collapse");
        equal(collapsible, true, "Element is collapsible");
        equal($elem.attr("data-hgrid-nav"), 2, "has data-hgrid-nav attribute");
    });

    test("defaultTaskNameFormatter is expandable", function() {
        var ret = myGrid.defaultTaskNameFormatter(0, 0, "Sort", null,
                                                {'uid': 2, 'type': 'folder', 'name': 'skaters',
                                                'parent_uid': 'null', "_collapsed": true});
        var $elem = $(ret).eq(2);
        var expandable = $elem.hasClass("expand");
        equal(expandable, true, "Element is expandable");

        equal($elem.attr("data-hgrid-nav"), 2, "has data-hgrid-nav attribute");
    });


    test("Grid has dropzone object", function() {
        ok(myGrid.dropZoneObj);
    });

    test("addColumn", function() {
        ok(myGrid.addColumn({id:'id', name:'id', field:'id'}));
    });

    test("retrieveUrl is null by default", function() {
        equal(myGrid.options.retrieveUrl, null);
    });

    test("getItemByValue", function(){
        var item = data[1]; // The item to retrieve
        // Retrieve item by its uid
        var ret = myGrid.getItemByValue(data, item.uid, "uid")
        equal(ret.uid, item.uid);
        equal(ret.id, item.id);
        equal(ret.absoluteIndent, 0);
        equal(ret.name, item.name);
        equal(ret.type, item.type);
        equal(ret.parent, item.parent);
        equal(ret.parent_uid, item.parent_uid);
    });

    test("navLevelFilter", function() {
        var item = data[2];
        myGrid.navLevelFilter(item.uid);
        equal(myGrid.currentIndentShift, item.absoluteIndent, "indent shift is updated");
        // TODO: finish me
    });

    var rootData, skaters, lazyGrid;
    function noErrorCallbackExpected(xhr, textStatus, errorThrown) {
        ok( false, 'Error callback executed: ' + errorThrown);
    }
    // Assertion for checking json respsonses from the mock server
    // e.g. responseEqual("/hello/", {"msg": "Hello world"});
    function responseEqual (url, expected) {
        $.ajax({
            url: url, dataType: "json",
            success: function(json) {
                deepEqual(json, expected);
            },
            error: noErrorCallbackExpected,
            complete: function(xhr) {
                start();
            }
        });
    }
    module("Async", {
        setup: function(){
            rootData = [{'uid': 0, 'type': 'folder', 'name': 'skaters'},
                            {'uid': 1, 'type': 'folder', 'name': 'soccer_players'},
                            {"uid": 2, "type": "file", "name": "foo.txt"}];

            skaters = [
                    {'uid': 1, 'type': 'file', 'name': 'tony', 'parent_uid': 0},
                    {'uid': 2, 'type': 'file', 'name': 'bucky', 'parent_uid': 0}
            ];
            // Set up fake json endpoints which return the data
            $.mockjax({
                url: "/files/",
                contentType: "application/json",
                responseText: rootData
            });

            $.mockjax({
                url: "/files/0",
                contentType: "aplication/json",
                responseText: skaters
            });

            lazyGrid = HGrid.create({
                container: "#myGrid",
                ajaxRoot: "/files/",
                breadcrumbBox: "#myGridBreadcrumbs",
                dropZone: true,
                url: '/',
            });

        }
    });

    asyncTest("test root response", function(){
        responseEqual("/files/", rootData);
    });
    asyncTest("test folder response", function() {
        responseEqual("/files/0", skaters);
    });

    test("Hgrid with asynchronous loading", function() {
        equal(lazyGrid.ajaxRoot, "/files/");
    })

})(jQuery);
