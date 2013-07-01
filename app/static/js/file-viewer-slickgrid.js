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

//Create columns
var columns = [
    {id: "#", name: "", width: 40, behavior: "selectAndMove", selectable: false, resizable: false, cssClass: "cell-reorder dnd"},
    {id: "title", name: "Title", field: "title", width: 400, cssClass: "cell-title", formatter: TaskNameFormatter, editor: Slick.Editors.Text, validator: requiredFieldValidator, sortable: true, defaultSortAsc: true},
    {id: "size", name: "Size", field: "size", width: 200, editor: Slick.Editors.Text, sortable: true}
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

            //Check if item has a parent
            if (info[i]['parent_path']){

                //Assign parent paths, find ID of parent and assign its ID to "parent" attribute
                d["parent_path"]=info[i]['parent_path'];
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
            d["title"] = info[i]['name'];
            d["size"] = info[i]['size'];
            d["unique"] = info[i]['unique'];
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
        var sortedData = sortHierarchy();

        rebuild(sortedData);
    }

    //Destroys and recreates the grid to reassign hierarchy
    function rebuild(sortedData){
        data = sortedData;
        var reorderedColumns=[];
        var oldColumns=grid.getColumns();
        console.log(sortcol);
        for(i=0; i<oldColumns.length; i++){
            reorderedColumns.push(oldColumns[i]);
        }

        grid.destroy();
        // initialize the model
        dataView.beginUpdate();
        dataView.setItems(data);
        dataView.setFilter(myFilter);
        dataView.endUpdate();

        // initialize the NEW grid
        grid = new Slick.Grid("#myGrid", dataView, reorderedColumns, options);
        initialize();
    }

    //Sets functions for moving rows, sorting, etc.
    function initialize(){
        grid.setSelectionModel(new Slick.RowSelectionModel());

        var moveRowsPlugin = new Slick.RowMoveManager({
            cancelEditOnDrag: true
        });

        //Create arrays to hold moving objects and their destinations
        var src = [];
        var dest = [];

        //Before rows are moved, make sure their dest is valid, document source and target
        moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, args) {
            for (var i = 0; i < args.rows.length; i++) {
                // no point in moving before or after itself
                for(var j=0; j<data.length; j++){
                    if(data[j]['id']==args.rows[i]){
                        src[i] = data[j]['path'];
                    }
                    console.log(args.insertBefore);
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
                console.log(dest[i]);
                var index = true;

                if (dest[i]!=null){
                    if (dest[i].indexOf(src[i]) == 0 || dest=="catch" || dest[i].indexOf("uploads") == 0){
                        index = false;
                    }
                }
                if (args.rows[i] == args.insertBefore - 1 || index == false || src[i] == "uploads" || dest[i] == "uploads") {
                    e.stopPropagation();
                    return false;
                }

            }
            return true;
        });

        //When rows are moved post to server and update data
        moveRowsPlugin.onMoveRows.subscribe(function (e, args) {
            console.log(dest);
            //Post to server
            $.post('/sg_post', {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
                //Make sure move succeeds
                if (response=="fail"){
                    e.stopImmediatePropagation();
                }
                else{
                    //Get new data and prep it
                    var insert = JSON.parse(response);
                    prep(insert);
                    var rows=[];

                    //Make sure all children move as well
                    var j = args.rows[0];
                    var destIndex;
                    var stopRow;
                    do{
                        rows.push(j);
                        j+=1;
                        stopRow = j;
                    }while(data[j] && data[j]['indent']>data[args.rows[0]]['indent']);

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

                    data = left.concat(extractedRows.concat(right));

                    var selectedRows = [];
                    for (var i = 0; i < rows.length; i++)
                        selectedRows.push(left.length + i);

                    //Here are possible method calls to not destroy grid
//                    dataView.beginUpdate();
//                    dataView.setItems(data);
//                    dataView.setFilter(myFilter);
//                    dataView.endUpdate();
//                    grid.invalidate();
//                    grid.render();

                    //Rebuild hierarchy and destroy/initialize grid
                    sortcol = "unique";
                    var data_sorted = data.sort(comparer);
                    var hierarchical = [];
                    BuildHierarchy(data, hierarchical, undefined);
                    rebuild(hierarchical);
                }
            });

//          Alexander's possible solution in place of rebuild()
//                        var startRow = args.rows[0];
//                        var destID = data[args.insertBefore]['id'];
//                        var destIndex;
//                        var j = 0;
//                        var stopRow;
//                        do{
//                            rows.push(j);
//                            j+=1;
//                            stopRow = j;
//                        }while(data[j]['indent']>data[args.rows[0]]['indent']);
//
//                        var movingData = data.splice(startRow, stopRow);
//                        for (item in data) {
//                            if (item['id'] == destID) {
//                                destIndex = data.indexOf(item);
//                            }
//                        }
//                        data.splice(destIndex, 0, movingData);
//                        var rows=[];
//
//                        var j = args.rows[0];
//                        var destID = data[args.insertBefore]['id'];
//                        var destIndex;
//                        //var j = 0;
//                        var stopRow;
//                        do{
//                            rows.push(j);
//                            j+=1;
//                            stopRow = j;
//                        }while(data[j]['indent']>data[args.rows[0]]['indent']);
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
            dd.helper.remove();
            $(dd.available).css("background", "beige");
        });
        //End drag helper functions

        //Create dropzone
        $("#dropzone")
            .bind("dropstart", function (e, dd) {
                $(this).css("background", "yellow");
            })
            .bind("dropend", function (e, dd) {
                $(dd.available).css("background", "pink");
            })
            .bind("drop", function (e, dd) {
                var rowsToDelete = dd.rows.sort().reverse();
                for (var i = 0; i < rowsToDelete.length; i++) {
                    data.splice(rowsToDelete[i], 1);
                }
                grid.invalidate();
                grid.setSelectedRows([]);
            });

        //Update the item when edited
        grid.onCellChange.subscribe(function (e, args) {
            dataView.updateItem(args.item.id, args.item);
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

    //Sorts new parent hierarchy
    function sortHierarchy(){
        var sorted = data.sort(comparer);
        var hierarchical = [];
        BuildHierarchy(sorted, hierarchical, undefined);
        return hierarchical;
    }

    //Rebuilds parent id hierarchy
    function BuildHierarchy(sorted, hierarchical, parent){
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
                BuildHierarchy(sorted, hierarchical, sorted[i]);
            }
        }
    }

    //Compare function
    function comparer(a, b) {
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
    }
})