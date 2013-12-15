
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

    // Custom test case that injects a lazy-loading Hgrid into the test
    function testLazyGrid (description, testFn){
        asyncTest("getItemUrl", function() {
            var lazyGrid;
            HGrid.create({
                container: "#myGrid",
                ajaxRoot: "/files/",
                ajaxOnComplete: function(xhr) {
                    start(); // Start the tests
                },
                ajaxOnSuccess: function(grid){
                    testFn(grid);

                },
                ajaxOnError: noErrorCallbackExpected,
                breadcrumbBox: "#myGridBreadcrumbs",
                dropZone: true,
                url: '/upload/',
            });
        });
        return;
    }
    var rootData, skaters, soccerPlayers, soccerPros, lazyGrid;
    module("Async", {
        setup: function(){
            rootData = [{'uid': 0, 'type': 'folder', 'name': 'skaters', "parent_uid": "null"},
                            {'uid': 1, 'type': 'folder', 'name': 'soccer_players', "parent_uid": "null"},
                            {"uid": 2, "type": "file", "name": "foo.txt", "parent_uid": "null"}];

            skaters = [
                    {'uid': 3, 'type': 'file', 'name': 'tony', 'parent_uid': 0},
                    {'uid': 4, 'type': 'file', 'name': 'bucky', 'parent_uid': 0}
            ];

            soccerPlayers = [
                {'uid': 5, 'type': 'folder', 'name': 'pro', 'parent_uid': 1},
                {'uid': 7, 'type': 'folder', 'name': 'amateur', 'parent_uid': 1},
            ];

            soccerPros = [
                {'uid': 6, 'type': 'file', 'name': 'messi', 'parent_uid': 5},
                {'uid': 5, 'type': 'file', 'name': 'ronaldo', 'parent_uid': 5},
            ]
            // Set up fake json endpoints which return the data
            $.mockjax({
                url: "/files/",
                contentType: "application/json",
                responseText: rootData
            });

            $.mockjax({
                url: "/files/0",
                contentType: "application/json",
                responseText: skaters
            });

            $.mockjax({
                url: "/files/1",
                contentType: "application/json",
                responseText: soccerPlayers
            });
            $.mockjax({
                url: "/files/5",
                contentType: "application/json",
                responseText: soccerPros
            });
        }

    });

    // Test the mock server
    asyncTest("test root response", function(){
        responseEqual("/files/", rootData);
    });
    asyncTest("test skaters endpoint", function() {
        responseEqual("/files/0", skaters);
    });
    asyncTest("test soccerPlayers endpoint", function() {
        responseEqual("/files/1", soccerPlayers);
    });
    asyncTest("test soccerPros endpoint", function() {
        responseEqual("/files/5", soccerPros);
    });

    asyncTest("Creating Hgrid with asynchronous loading", function() {
        var lazyGrid;
        HGrid.create({
            container: "#myGrid",
            ajaxRoot: "/files/",
            ajaxOnComplete: function(xhr) {
                start(); // Start the tests
            },
            ajaxOnSuccess: function(grid){
                lazyGrid = grid;
                equal(lazyGrid.options.ajaxRoot, "/files/", "ajaxRoot is correct");
                // each data item has the correct properties
                for (var i = lazyGrid.data.length - 1; i >= 0; i--) {
                    var item = lazyGrid.data[i];
                    equal(item.uid, rootData[i].uid);
                    equal(item.type, rootData[i].type);
                    equal(item.name, rootData[i].name);
                    // folders are collapsed
                    if (item.type === "folder") {
                        ok(item._collapsed, "folder is collapsed");
                    };
                };
            },
            ajaxOnError: noErrorCallbackExpected,
            breadcrumbBox: "#myGridBreadcrumbs",
            dropZone: true,
            url: '/upload/',
        });
        $.mockjaxClear();
    });

    asyncTest("getItemUrl", function() {
        var lazyGrid;
        HGrid.create({
            container: "#myGrid",
            ajaxRoot: "/files/",
            ajaxOnComplete: function(xhr) {
                start(); // Start the tests
            },
            ajaxOnSuccess: function(grid){
                var item;
                item = grid.getItemByValue(grid.data, 1, "uid");
                equal(grid.getItemUrl(item), "/files/1");
                item = grid.getItemByValue(grid.data, 2, "uid");
                equal(grid.getItemUrl(item), "/files/2");
                equal(grid.getItemUrl(), "/files/");
            },
            ajaxOnError: noErrorCallbackExpected,
            breadcrumbBox: "#myGridBreadcrumbs",
            dropZone: true,
            url: '/upload/',
        });
        $.mockjaxClear();
    });

    asyncTest("getItemsFromServer", function() {
        HGrid.create({
            container: "#myGrid",
            ajaxRoot: "/files/",
            ajaxOnSuccess: function(grid){
                // Get the data for item 0 (the skaters folder)
                var item = grid.getItemByValue(grid.data, "0", "uid");
                grid.getItemsFromServer(item, function(data){
                    start();
                    deepEqual(data, skaters);
                });
            },
            ajaxOnError: noErrorCallbackExpected,
            breadcrumbBox: "#myGridBreadcrumbs",
            dropZone: true,
            url: '/upload/',
        });
    });

    asyncTest("addItemsFromServer", function() {
        HGrid.create({
            container: "#myGrid",
            ajaxRoot: "/files/",
            ajaxOnSuccess: function(grid){
                // Add the data from item 1 (the soccer players folder)
                var parentItem = grid.getItemByValue(grid.data, "1", "uid");
                grid.addItemsFromServer(parentItem, function(data) {
                    start();
                    equal(data.length, rootData.length + soccerPlayers.length);
                    data.forEach(function(item) {
                        // Foldrs are collapsed
                        if (item.type === "folder") {
                            ok(item._collapsed,"folder " + item.name + " is collapsed");
                        };
                    })
                })
            },
            ajaxOnError: noErrorCallbackExpected,
            breadcrumbBox: "#myGridBreadcrumbs",
            dropZone: true,
            url: '/upload/',
        });
    });

    asyncTest("getItemUrl if itemUrl is specified", function() {
        var lazyGrid;
        HGrid.create({
            container: "#myGrid",
            ajaxRoot: "/files/",
            // Specify how to build the urls
            itemUrl: function(rootUrl, item){
                return rootUrl + item.name;
            },
            ajaxOnComplete: function(xhr) {
                start(); // Start the tests
            },
            ajaxOnSuccess: function(grid){
                var item = grid.getItemByValue(grid.data, "soccer_players", "name");
                ok(item);
                equal(grid.getItemUrl(item), "/files/soccer_players");
                item = grid.getItemByValue(grid.data, "skaters", "name");
                ok(item);
                equal(grid.getItemUrl(item), "/files/skaters");
            },
            ajaxOnError: noErrorCallbackExpected,
            breadcrumbBox: "#myGridBreadcrumbs",
            dropZone: true,
            url: '/upload/',
        });
        $.mockjaxClear();
    });

})(jQuery);
