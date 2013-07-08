function requiredFieldValidator(value) {
    if (value == null || value == undefined || !value.length) {
        return {valid: false, msg: "This is a required field"};
    } else {
        return {valid: true, msg: null};
    }
}

//Gives each div a class based on type (folder or file)
var TaskNameFormatter = function (row, cell, value, columnDef, dataContext) {
    value = value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
    var idx = dataView.getIdxById(dataContext.id);
    if (data[idx]['type']=='folder') {
        if (dataContext._collapsed) {
            return spacer + " <span class='toggle expand'></span>&nbsp;" + value;
        } else {
            return spacer + " <span class='toggle collapse'></span>&nbsp;" + value;
        }
    } else {
        return spacer + " <span class='toggle'></span>&nbsp;" + value;
    }
};

var dataView;
var grid;
var data = [];
var sortAsc = true;
//Create arrays to hold moving objects and their destinations
var src = [];
var dest = [];

//Create columns
var columns = [
    {id: "#", name: "", width: 40, behavior: "selectAndMove", selectable: false, resizable: false, cssClass: "cell-reorder dnd"},
    //{id: "id", name: "ID", field: "id", width: 40, sortable: true},
    {id: "name", name: "Name", field: "name", width: 450, cssClass: "cell-title", formatter: TaskNameFormatter, editor: Slick.Editors.Text, validator: requiredFieldValidator, sortable: true, defaultSortAsc: true},
    {id: "size_read", name: "Size", field: "size_read", width: 110, editor: Slick.Editors.Text, sortable: true}
];

//SlickGrid options
var options = {
    editable: false,
    enableCellNavigation: true,
    asyncEditorLoading: false,
    enableColumnReorder: true
};

//Filter for expand/collapse parents
function myFilter(item) {
    if (item.parent != null) {
        var parentIdx = dataView.getIdxById(item.parent);
        var parent = data[parentIdx];

        while (parent) {
            if (parent._collapsed) {
                return false;
            }

            var parentParentIdx = dataView.getIdxById(parent.parent);
            parent = data[parentParentIdx];
        }
    }
    return true;
}

function renderCell(row, cell, value, columnDef, dataContext) {
    return "<div> test <b>html</b></div>";
}

//Function called on page load
$(function (){
    var y = info_dict;
    prep(y);

    //Receives data from server and prepares it
    function prep(info){
        data=[];
        var indent = 0;
        var checker ={};

        //Go through each item in info and create a dictionary with values needed for grid
        for (var i = 0; i < info.length; i++) {
            var parents = [];
            var d = (data[i] = {});
            var parent;

            //Assign parent paths, find ID of parent and assign its ID to "parent" attribute
            d["parent_path"]=info[i]['parent_path'];
            //Check if item has a parent
            if (info[i]['parent_path']!="null"){

                for(var j=0; j<data.length; j++){
                    if (data[j]['path']==d["parent_path"]){
                        d["parent"]= j;
                    }
                }
                //If parent hasn't been encountered, increment the indent
                if (!(info[i]['parent_path'] in checker)){
                    indent++;
                }
                //If it has been encountered, make indent the same as others with same parent
                else {
                    indent = checker[info[i]['parent_path']];
                }

                //Make sure parent_path is in checker
                checker[info[i]['parent_path']]=indent;
            }


            //If no parent, set parent to null and indent to 0
            else {
                indent=0;
                d["parent"]=null;
            }

            //Set other values
            d["path"] = info[i]['path'];
            d["id"] = i;
            d["indent"] = indent;
            d["name"] = info[i]['name'];
            d["size"] = info[i]['size'];
            d["size_read"] = readableSize(info[i]['size']);
            d["type"] = info[i]['type'];
        }
    }
    // initialize the model
    dataView = new Slick.Data.DataView({ inlineFilters: true });
    dataView.beginUpdate();
    dataView.setItems(data);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    // initialize the grid
    grid = new Slick.Grid("#myGrid", dataView, columns, options);
    initialize();

    //Function called when sort is clicked
    function onSort(e, args){
        sortAsc = !sortAsc;
        sortcol = args.sortCol.field;
        var new_data = grid.sortHierarchy();
        prep_java(new_data);
        dataView.setItems(data);
        grid.invalidate();
        grid.setSelectedRows([]);
        grid.render();
    }

    //Same as previous prep function, but changes existing data instead of creating new
    function prep_java(sortedData){
        var checker = {};
        var indent = 0;

        for (var i = 0; i < sortedData.length; i++) {
            var parents = [];
            var d = {};
            var parent;

            //Assign parent paths, find ID of parent and assign its ID to "parent" attribute
            d["parent_path"]=sortedData[i]['parent_path'];
            //Check if item has a parent
            if (sortedData[i]['parent_path']){
                for(var j=0; j<sortedData.length; j++){
                    if (sortedData[j]['path']==d["parent_path"] && !d["parent"]){
                        d["parent"]= j;
                    }
                }
                //If parent hasn't been encountered, increment the indent
                if (!(sortedData[i]['parent_path'] in checker)){
                    indent++;
                }
                //If it has been encountered, make indent the same as others with same parent
                else {
                    indent = checker[sortedData[i]['parent_path']];
                }

                //Make sure parent_path is in checker
                checker[sortedData[i]['parent_path']]=indent;
            }

            //If no parent, set parent to null and indent to 0
            else {
                indent=0;
                d["parent"]=null;
            }

            //Set other values
            d["path"] = sortedData[i]['path'];
            d["id"] = i;
            d["indent"] = indent-1;
            d["name"] = sortedData[i]['name'];
            d["size"] = sortedData[i]['size'];
            d["size_read"] = readableSize(sortedData[i]['size']);
            d["type"] = sortedData[i]['type'];
            data[i]=d;
        }
    }

    //Sets functions for moving rows, sorting, etc.
    function initialize(){
        grid.setSelectionModel(new Slick.RowSelectionModel());

        var moveRowsPlugin = new Slick.RowMoveManager({
            cancelEditOnDrag: true
        });

        //Before rows are moved, make sure their dest is valid, document source and target
        moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, args) {
            src = [];
            dest = [];
            for (var i = 0; i < args.rows.length; i++) {
                // no point in moving before or after itself
                for(var j=0; j<data.length; j++){
                    if(data[j]['id']==args.rows[i]){
                        src[i] = data[j]['path'];
                    }
                    if(data[j]['id']==args.insertBefore){
                        if (data[j-1]){
                            if(data[j-1]['type']=='folder') {
                                dest[i] = data[j-1]['path'];
                            }
                            else{
                                dest[i] = data[j-1]['parent_path'];
                            }
                        }
                        else {
                            dest[i] = null;
                        }
                    }
                    if(args.insertBefore>data.length-1){
                        var m = args.insertBefore
                        if (data[m-1]){
                            if(data[m-1]['type']=='folder') {
                                dest[i] = data[m-1]['path'];
                            }
                            else{
                                dest[i] = data[m-1]['parent_path'];
                            }
                        }
                    }
                }
                if (!dest[i]){
                    dest[i] = null;
                }
                var index = true;
                grid.draggerGuide(e, args);
                if (dest[i]!=null){
                    if (dest[i].indexOf(src[i]) == 0 || dest=="catch" || dest[i].indexOf("uploads") == 0){
                        index = false;
                    }
                }
                if (args.rows[i] == args.insertBefore - 1 || index == false || src[i] == "uploads" || dest[i] == "uploads") {
                    grid.removeDraggerGuide();
                    e.stopPropagation();
                    return false;
                }

            }
            return true;
        });

////        When rows are moved post to server and update data
//        moveRowsPlugin.onMoveRows.subscribe(function (e, args) {
//            grid.removeDraggerGuide();
//            //Post to server
//            $.post('/sg_move', {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
//                //Make sure move succeeds
//                if (response=="fail"){
//                    e.stopImmediatePropagation();
//                }
//                else{
//                    var insert = JSON.parse(response);
//                    prep(insert);
//
////                    sortcol=grid.getSortColumns[0];
////                    var sorted = grid.sortHierarchy();
////                    prep_java(sorted);
//                    dataView.setItems(data);
//                    grid.invalidate();
//                    grid.setSelectedRows([]);
//                    grid.render();
//                }
//            });
//        });

        moveRowsPlugin.onMoveRows.subscribe(function(e, args){
            grid.removeDraggerGuide();
            $.post('/sg_move', {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
                //Make sure move succeeds
                if (response=="fail"){
                    e.stopImmediatePropagation();
                }
                else{

                    for(var y=0; y<args.rows.length; y++){
                        ;
                        var rows=[];

                        //Make sure all children move as well
                        var j = args.rows[y];
                        var destIndex;
                        var stopRow;
                        do{
                            rows.push(j);
                            j+=1;
                            stopRow = j;
                        }while(data[j] && data[j]['indent']>data[args.rows[y]]['indent']);

                        //Update data
                        var extractedRows = [], left, right;

                        var insertBefore = args.insertBefore;
                        left = data.slice(0, insertBefore);
                        right = data.slice(insertBefore, data.length);

                        rows.sort(function(a,b) { return a-b; });

                        for (var i = 0; i < rows.length; i++) {
                            extractedRows.push(data[rows[i]]);
                        }

                        rows.reverse();

                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            if (row < insertBefore) {
                                left.splice(row, 1);
                            } else {
                                right.splice(row - insertBefore, 1);
                            }
                        }

//                    Change parent path and path
                        var checker = {};
                        var old_path = extractedRows[0]['path'];
                        extractedRows[0]['path'] = dest[0] + '/' + extractedRows[0]['name'];
                        var new_path = extractedRows[0]['path'];
                        checker[old_path]=new_path;
                        extractedRows[0]['parent_path']=dest[0];

                        if (extractedRows.length > 1){
                            for(var m=1; m<extractedRows.length; m++){
                                extractedRows[m]['parent_path']=checker[extractedRows[m]['parent_path']];
                                old_path=extractedRows[m]['path'];
                                extractedRows[m]['path']=extractedRows[m]['parent_path']+'/'+extractedRows[m]['name'];
                                checker[old_path]=extractedRows[m]['path'];
                            }
                        }

                        data = left.concat(extractedRows.concat(right));

                        var selectedRows = [];
                        for (var i = 0; i < rows.length; i++)
                            selectedRows.push(left.length + i);

//                        grid.size_update(data[args.rows[y]]['parent_path']);
                        prep_java(data);

                    }
                    //Update sizes
//                    for(var i=0; i<src.length; i++){
//                        grid.size_update(src[i])
//                    }
//                    grid.size_update(dest[0]);

                    dataView.setItems(data);
                    grid.invalidate();
                    grid.setSelectedRows([]);
                    grid.render();
                }
            });
        });

        grid.registerPlugin(moveRowsPlugin);

        //Drag helper functions
        grid.onDragInit.subscribe(function (e, dd) {
            // prevent the grid from cancelling drag'n'drop by default
            e.stopImmediatePropagation();
        });

        grid.onDragStart.subscribe(function (e, dd) {
            var cell = grid.getCellFromEvent(e);
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

            e.stopImmediatePropagation();
            dd.mode = "recycle";

            var selectedRows = grid.getSelectedRows();

            if (!selectedRows.length || $.inArray(dd.row, selectedRows) == -1) {
                selectedRows = [dd.row];
                grid.setSelectedRows(selectedRows);
            }

            dd.rows = selectedRows;
            dd.count = selectedRows.length;

            var proxy = $("<span></span>")
                .css({
                    position: "absolute",
                    display: "inline-block",
                    padding: "4px 10px",
                    background: "#e0e0e0",
                    border: "1px solid gray",
                    "z-index": 99999,
                    "-moz-border-radius": "8px",
                    "-moz-box-shadow": "2px 2px 6px silver"
                })
                .text("Drag to Recycle Bin to delete " + dd.count + " selected row(s)")
                .appendTo("body");

            dd.helper = proxy;

            $(dd.available).css("background", "pink");

            return proxy;
        });

        grid.onDrag.subscribe(function (e, dd) {
            if (dd.mode != "recycle") {
                return;
            }
            dd.helper.css({top: e.pageY + 5, left: e.pageX + 5});
        });

        grid.onDragEnd.subscribe(function (e, dd) {
            if (dd.mode != "recycle") {
                return;
            }
            dd.helper.remove();
            $(dd.available).css("background", "beige");
        });
        //End drag helper functions

        //Update the item when edited
        grid.onCellChange.subscribe(function (e, args) {
            grid.getOptions().editable=false;
            var src=args.item;
            $.post('/sg_edit', {grid_item: JSON.stringify(src)}, function(new_title){
                if(new_title!="fail"){
                    var i = src['id']+1;
                    while(data[i]['parent_path'].indexOf(data[src['id']]['path'])==0){
                        if(data[i]['parent_path']==data[src['id']]['path']){
                            data[i]['parent_path']=new_title;
                            data[i]['path']=new_title+ "/" + data[i]['name'];
                        }
                        else{
                            data[i]['parent_path']=data[data[i]['parent']]['path'];
                            data[i]['path']=data[i]['parent_path'] + "/" + data[i]['name'];
                        }
                        i++;
                    }
                    src['path']=new_title;
                    dataView.updateItem(src.id, src);
                }
                else{
                    src['name']=src['path'];
                    alert("You can't change the uploads folder!");
                    dataView.updateItem(src.id, src);
                }
            });
        });

        //When expand/collapse clicked, show/hide children
        grid.onClick.subscribe(function (e, args) {
            if ($(e.target).hasClass("toggle")) {
                var item = dataView.getItem(args.row);
                if (item) {
                    if (!item._collapsed) {
                        item._collapsed = true;
                    } else {
                        item._collapsed = false;
                    }

                    dataView.updateItem(item.id, item);
                }
                e.stopImmediatePropagation();
            }
            grid.getOptions().editable=false;
        });

        //When a cell is double clicked, make it editable (unless it's uploads)
        grid.onDblClick.subscribe(function (e, args) {
            if(data[grid.getActiveCell().row]['path']!="uploads" && grid.getActiveCell().cell==grid.getColumnIndex('name')){
                grid.getOptions().editable=true;
            }
        });


        //If amount of rows are changed, update and render
        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        //When rows are edited, re-render
        dataView.onRowsChanged.subscribe(function (e, args) {
            grid.invalidateRows(args.rows);
            grid.render();
        });

        //When columns are dragged around, make columns new order
        grid.onColumnsReordered.subscribe(function(e, args){
            grid.invalidate();
            columns=args.cols;
            grid.render();
        });

        //When sort is clicked, call sort function
        grid.onSort.subscribe(function (e, args) {
            onSort(e, args);
        });

    }


    // Return Mode to normal after drop
    $.drop({mode: "mouse"});
    //Create Drop Zone
    $("#slick-recycle")
//          .bind("dropstart", function (e, dd) {
        .bind("dragend", function (e, dd) {
            if (dd.mode != "recycle") {
                return;
            }
            $(this).css("background", "yellow");
        })
        .bind("dropend", function (e, dd) {
            if (dd.mode != "recycle") {
                return;
            }
            $(dd.available).css("background", "pink");
        })

        //Delete files and folders when dragged to recycle bin, confirm delete
        .bind("drop", function (e, dd) {
//          .bind("dragend", function (e, dd) {
            if (dd.mode != "recycle") {
                return;
            }
            var rowsToDelete = dd.rows.sort().reverse();
            var src = data[rowsToDelete];
            var confirm_delete = confirm("Are you sure you want to delete this file?");
            if (confirm_delete == true) {

                //Post to server and delete item
                $.post('/file_deleter', {grid_item: JSON.stringify(src)}, function(response) {
                    if (response == "fail") {
                        alert("This file can not be deleted");
                    } else {

                        //Splice data and delete all children if folder is dropped
                        var rows=[];
                        var j = rowsToDelete[0];
                        var stopRow;
                        do{
                            rows.push(j);
                            j+=1;
                            stopRow = j;
                        }while(data[j] && data[j]['indent']>data[rowsToDelete[0]]['indent']);
                        var check = data.splice(rows[0], rows.length);
                        var x = rowsToDelete[0];

                        //Change IDs and parents for rest of data to re-render grid properly
                        for(x; x<data.length; x++){
                            data[x]['id']=data[x]['id']-rows.length;
                            if(data[x]['parent_path']){
                                if (check[0]['parent_path']){
                                    if(check[0]['parent_path']!=data[x]['parent_path']){
                                        data[x]['parent']=data[x]['parent']-rows.length;
                                    }
                                }

                            }

                        }
                        dataView.setItems(data);
                        grid.invalidate();
                        grid.setSelectedRows([]);
                        grid.render();
                    }
                });
            }
        });

    //Sorts new parent hierarchy
    grid.sortHierarchy = function (){
        var sorted = data.sort(grid.comparer);
        var hierarchical = [];
        grid.BuildHierarchy(sorted, hierarchical, undefined);
        return hierarchical;
    };

    //Rebuilds parent id hierarchy
    grid.BuildHierarchy =  function (sorted, hierarchical, parent){
        for(var i=0; i < sorted.length; i++)
        {
            var item = sorted[i];
            var parentId;
            if(parent){
                parentId = parent.id;
            }
            else{
                parentId = undefined;
            }
            if(item.parent == parentId){
                hierarchical.push(sorted[i]);
                grid.BuildHierarchy(sorted, hierarchical, sorted[i]);
            }
        }
    };

    //Compare function
    grid.comparer = function (a, b) {

        //If sorting by size, must sort by int value, not readable string
        if (sortcol=="size_read"){
            sortcol="size";
        }
        var x = a[sortcol], y = b[sortcol];

        if(x == y){
            return 0;
        }
        if(sortAsc){
            return x > y ? 1 : -1;
        }
        else{
            return x < y ? 1 : -1;
        }
    };

    // Remove the Blue Background from drag destination rows
    grid.removeDraggerGuide = function() {
        $(".dragger-guide").removeClass("dragger-guide");
    };


    // Add a Blue Background to the drag destination row
    grid.draggerGuide = function(e, args) {
        grid.removeDraggerGuide();
        // If a target row exists
        if(dest[0]){
            if (dest[0]!=null){
                for (var x = 0; x<data.length; x++){
                    if (data[x]['path']==dest[0]){
                        dragParent = grid.getCellNode(data[x]['id'], 0).parentNode;
                        $(dragParent).addClass("dragger-guide");
                    }
                }
            }
        }
    };

    grid.size_update = function(folder) {
        var size=0;
        for (var i=0; i<data.length; i++){
            if (data[i]['path']==folder){
                var target = data[i];
                break;
            }
        }
        var j = target['id']+1;
        do{
            size+=data[j]['size'];
            j+=1;
        }while(data[j] && data[j]['indent']>target['indent']);

        target['size_read']=readableSize(size);
        target['size'] = size;
        if (target['parent']!=null){
            grid.size_update(target['parent_path']);
        }
    };

    grid.callReadableSize = function(bytes){
        readableSize(bytes);
    };

    //From StackOverflow
    function readableSize(bytes) {
        var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
        var e = Math.floor(Math.log(bytes) / Math.log(1024));
        var returner;
        if (e==0){
            returner = (bytes / Math.pow(1024, e) + " bytes");
        }
        else{
            returner = (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
        }

        if (bytes== 0){
            returner = "0 bytes";
        }

        return returner;
    };

});
