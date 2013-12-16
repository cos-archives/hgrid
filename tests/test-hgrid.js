
(function($){
    "use strict";

    var data, myGrid, referenceItem;

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
                {'uid': 11, 'type': 'file', 'name': 'joe', 'parent_uid': 7},
                {'uid': 12, 'type': 'folder', 'name': 'new_tests', 'parent_uid': 'null'}
            ];
            myGrid = HGrid.create({
                container: "#myGrid",
                info: data,
                breadcrumbBox: "#myGridBreadcrumbs",
                dropZone: true,
                url: '/',
            });

//            referenceItem = myGrid.data[0];
        },

        teardown: function(){
            myGrid.destroy();
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

//    test("getItemByValue", function(){
//
//        ok(_.isEqual(
//            myGrid.getItemByValue(myGrid.data, referenceItem['uid'], "uid"),
//            referenceItem
//        ), "Find by uid");
//
//        ok(_.isEqual(
//            myGrid.getItemByValue(myGrid.data, referenceItem['id'], "id"),
//            referenceItem
//        ), "Find by id");
//
//        ok(_.isEqual(myGrid.getItemByValue(myGrid.data, referenceItem['name'], "name"),
//            referenceItem
//        ), "Find by name");
//    });

    test("getItemsByValue", function(){
        var referenceItem = myGrid.getItemByValue(myGrid.data, "new_tests", "name");
        var item1 = {'uid': 'a', 'type': 'file', 'name': 'first_child', 'parent_uid': 12};
        var item2 = {'uid': 'b', 'type': 'file', 'name': 'second_child', 'parent_uid': 12};
        var item3 = {'uid': 'c', 'type': 'folder', 'name': 'second_folder', 'parent_uid': 'null'};
        myGrid.addItem(item1);
        myGrid.addItem(item2);
        myGrid.addItem(item3);

        ok(_.isEqual(
            $(myGrid.getItemsByValue(myGrid.data, referenceItem['uid'], "parent_uid"))
                .map(function(idx, elm){ return elm['uid'] }).get().sort(),
            [item1['uid'], item2['uid']]
        ), "Find children by parent_uid, compare sorted lists");

//        ok(_.isEqual(
//            $(myGrid.getItemsByValue(myGrid.data, "folder", "type"))
//                .map(function(idx, elm){ return elm['uid'] }).get().sort(),
//            [referenceItem['uid'], item3['uid']]
//        ), "Find all folders, compare sorted lists");
    });

    test("addColumn", function(){
        var newColumn = {id:'id', name:'id', field:'id'};
        myGrid.addColumn(newColumn);
        var columns = myGrid.Slick.grid.getColumns();
        ok(_.isEqual(
            columns[columns.length-1]['id'],
            newColumn['id']
        ), "IDs of the columns are the same");
    });

    test("addItem", function(){
        var item = {'uid': 1, 'type': 'file', 'name': 'first_child', 'parent_uid': 0};
        myGrid.addItem(item);

        ok(_.isEqual(
            myGrid.getItemByValue(myGrid.data, item['uid'], "uid"),
            item
        ), "Item with correct uid is in data");
    });

    test("deleteItems", function(){
        var referenceItem = myGrid.getItemByValue(myGrid.data, "new_tests", "name");
        var item1 = {'uid': 'a', 'type': 'file', 'name': 'first_child', 'parent_uid': 12};
        var item2 = {'uid': 'b', 'type': 'file', 'name': 'second_child', 'parent_uid': 12};
        var item3 = {'uid': 'c', 'type': 'folder', 'name': 'second_folder', 'parent_uid': 'null'};
        myGrid.addItem(item1);
        myGrid.addItem(item2);
        myGrid.addItem(item3);
        myGrid.deleteItems([item1['uid']]);

        ok(_.isEqual(
            myGrid.getItemByValue(myGrid.data, item1['uid'], "uid"),
            false
        ), "Item deleted is not found in grid")

        myGrid.deleteItems([referenceItem['uid']]);

        ok(_.isEqual(
            myGrid.getItemByValue(myGrid.data, item2['uid'], "uid") || myGrid.getItemByValue(myGrid.data, referenceItem['uid'], "uid"),
            false
        ), "Folder deleted as well as child");

        ok(myGrid.getItemByValue(myGrid.data, item3['uid'], "uid"), "Undeleted item still in grid");
    });

    test("editItem", function(){
        var referenceItem = myGrid.getItemByValue(myGrid.data, "new_tests", "name");
        myGrid.editItem(referenceItem['uid'], "name", "new_name");

        ok(_.isEqual(
            referenceItem['name'],
            "new_name"
        ), "Item's property changed");

        ok(_.isEqual(
            myGrid.getItemByValue(myGrid.data, referenceItem['uid'], "uid")['name'],
            "new_name"
        ), "Property changed in data");
    });

    test("moveItems", function(){
        var referenceItem = myGrid.getItemByValue(myGrid.data, "new_tests", "name");
        var item1 = {'uid': 1, 'type': 'file', 'name': 'first_child', 'parent_uid': 12};
        var item2 = {'uid': 2, 'type': 'file', 'name': 'second_child', 'parent_uid': 12};
        var item3 = {'uid': 3, 'type': 'folder', 'name': 'second_folder', 'parent_uid': 'null'};
        myGrid.addItem(item1);
        myGrid.addItem(item2);
        myGrid.addItem(item3);

        myGrid.moveItems([0], 3);

        ok(_.isEqual(item1['parent_uid'], referenceItem['uid']), "Child 1 still has correct parent_uid");
        ok(_.isEqual(item2['parent_uid'], referenceItem['uid']), "Child 2 still has correct parent_uid");
        ok(_.isEqual(referenceItem['parent_uid'], item3['parent_uid']), "Moved item now has destination uid as parent_uid");
    });

})(jQuery);
