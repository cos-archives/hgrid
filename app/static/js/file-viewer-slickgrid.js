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

var NameFormatter = function (row, cell, value, columnDef, dataContext){
    if(value == 'another'){
        return "<a href=\"http://www.w3schools.com/\">" + TaskNameFormatter(row, cell, value, columnDef, dataContext) + "</a>";
    }
    else return TaskNameFormatter(row, cell, value, columnDef, dataContext);
}

var dataView;
var grid;
var data = [];
var sortAsc = true;
var numRowsCollapsed = 0;



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

//Function called on page load
function hGridSlickInit(hGridInfo, hGridContainer, hGridColumns){
    prep(hGridInfo);
    // initialize the model and grid
    dataView = new Slick.Data.DataView({ inlineFilters: true });
    dataView.beginUpdate();
    dataView.setItems(data);
    dataView.setFilter(myFilter);
    dataView.endUpdate();
    grid = new Slick.Grid(hGridContainer, dataView, hGridColumns, options);
    initialize();
};


function prep(info){
    data = [];
    var indent = 0;
    var checker = {};
    var i = 0;
    var data_counter=0;

    while (info.length>=1){
        var d = info[i];
        if (info[i]['parent_uid']=="null"){
            d['parent']=null;
            d['indent']=0;
            d['id']=data_counter;
            checker[d['uid']]=[d['indent'], data_counter];
            data[data_counter]=d;
            data_counter++;
            info.splice(i, 1);
        }
        else if(info[i]['parent_uid'] in checker){
            d['parent']=checker[d['parent_uid']][1];
            d['indent']=checker[d['parent_uid']][0]+1;
            d['id']=data_counter;
            checker[d['uid']]=[d['indent'], data_counter];
            data[data_counter]=d;
            data_counter++;
            info.splice(i, 1);
        }
        else{
            i++;
        }
        if(i>=info.length){
            i=0;
        }
        if(d['name']=="null"){
            d['name']+=i
        }
    }

    HGrid.createPaths(data);
        sortcol='sortpath';
        sortHierarchy();
        prep_java(data);
    }

//Same as previous prep function, but changes existing data instead of creating new
    function prep_java(sortedData){
        var checker = {};
        var indent = 0;
        for (var i = 0; i < sortedData.length; i++) {
            var parents = [];
            var parent;
            var d = {};
            var path = [];
//      var d = sortedData[i];
            //Assign parent paths, find ID of parent and assign its ID to "parent" attribute
            d['parent_uid']=sortedData[i]['parent_uid'];
            path.push(sortedData[i]['uid']);
            //Check if item has a parent
            if (sortedData[i]['parent_uid']!="null"){
                for(var j=0; j<sortedData.length; j++){
                    if (sortedData[j]['uid']==d['parent_uid'] && !d["parent"]){
                        d["parent"]= j;
                        break;
                    }
                }
                //If parent hasn't been encountered, increment the indent
                if (!(sortedData[i]['parent_uid'] in checker)){
                    indent++;
                }
                //If it has been encountered, make indent the same as others with same parent
                else {
                    indent = checker[sortedData[i]['parent_uid']];
                }
                //Make sure parent_path is in checker
                checker[sortedData[i]['parent_uid']]=indent;
            }
            //If no parent, set parent to null and indent to 0
            else {
                indent=0;
                d["parent"]=null;
            }
            if (sortedData[i]._collapsed){
                d._collapsed=sortedData[i]._collapsed;
            }
            //Set other values
            d["id"] = i;
            d["indent"] = indent;
            d = $.extend(true, sortedData[i], d);
            data[i]=d;
        }
    }
//Sets functions for moving rows, sorting, etc.
    function initialize(){
        var src = [];
        var dest = "";
        grid.setSelectionModel(new Slick.RowSelectionModel());
        var moveRowsPlugin = new Slick.RowMoveManager({
            cancelEditOnDrag: true
        });

        //Before rows are moved, make sure their dest is valid, document source and target
        moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, args) {
            src = [];
            dest = "";
            //console.log(grid.getCellNode(args.insertBefore, grid.getColumnIndex('id')));
            var inserter=null;
            if (grid.getDataItem(args.insertBefore-1)){
                inserter = grid.getDataItem(args.insertBefore-1);
            }
            try{
                var insertBefore = grid.getDataItem(args.insertBefore)['id'];
            }
            catch(error){
                if(error.name == TypeError){
                    //e.stopImmediatePropagation();
                    return false;
                }
            }
            for (var i = 0; i < args.rows.length; i++) {
                // no point in moving before or after itself
                for(var j=0; j<data.length; j++){
                    if(data[j]['id']==args.rows[i]){
                        src[i] = data[j]['path'];
                    }
                    if(data[j]['id']==insertBefore){
                        if (data[j-1]){
                            if(data[j-1]['type']=='folder') {
                                dest = data[j-1]['path'];
                            }
                            else{
                                var x = data[j-1]['parent_uid'];
                                dest = HGrid.getItemByValue(data, x, 'uid')['path'];
                            }
                        }
                        else {
                            dest = null;
                        }
                    }
                    if(insertBefore>data.length-1){
                        var m = insertBefore;
                        if (data[m-1]){
                            if(data[m-1]['type']=='folder') {
                                dest = data[m-1]['path'];
                            }
                            else{
                                var x = data[m-1]['parent_uid'];
                                dest = HGrid.getItemByValue(data, x, 'uid')['path'];
                            }
                        }
                    }
                }
                if (dest==""){
                    dest = null;
                }
                var index = true;

                if (dest!=null){
                    if (dest.indexOf(src[i][src[i].length-1]) != -1 || dest=="catch" || dest.indexOf("uploads") == 0){
                        index = false;
                    }
                }
                else{
                    inserter=null;
                }
                draggerGuide(e, args, inserter);
                if (args.rows[i] == insertBefore - 1 || index == false || src[i] == "uploads" || dest == "uploads") {
                    removeDraggerGuide();
                    //e.stopPropagation();
                    return false;
                }
            }
            return true;
        });

//        When rows are moved post to server and update data
        moveRowsPlugin.onMoveRows.subscribe(function(e, args){
            var src_id = [];
            for(var i=0; i<src.length; i++){
                src_id.unshift(src[i].pop());
            }
            rowMove(e, args, "/sg_move", src_id, dest);
        });

        grid.registerPlugin(moveRowsPlugin);

//        //Drag helper functions
//        grid.onDragInit.subscribe(function (e, dd) {
//            // prevent the grid from cancelling drag'n'drop by default
//            e.stopImmediatePropagation();
//        });
//
//        grid.onDragStart.subscribe(function (e, dd) {
//            var cell = grid.getCellFromEvent(e);
//            if (!cell) {
//                return;
//            }
//
//            dd.row = cell.row;
//            if (!data[dd.row]) {
//                return;
//            }
//
//            if (Slick.GlobalEditorLock.isActive()) {
//                return;
//            }
//
//            e.stopImmediatePropagation();
//            dd.mode = "recycle";
//
//            var selectedRows = grid.getSelectedRows();
//
//            if (!selectedRows.length || $.inArray(dd.row, selectedRows) == -1) {
//                selectedRows = [dd.row];
//                grid.setSelectedRows(selectedRows);
//            }
//
//            dd.rows = selectedRows;
//            dd.count = selectedRows.length;
//
//            var proxy = $("<span></span>")
//                .css({
//                    position: "absolute",
//                    display: "inline-block",
//                    padding: "4px 10px",
//                    background: "#e0e0e0",
//                    border: "1px solid gray",
//                    "z-index": 99999,
//                    "-moz-border-radius": "8px",
//                    "-moz-box-shadow": "2px 2px 6px silver"
//                })
//                .text("Drag to Recycle Bin to delete " + dd.count + " selected row(s)")
//                .appendTo("body");
//
//            dd.helper = proxy;
//
//            $(dd.available).css("background", "pink");
//
//            return proxy;
//        });
//
//        grid.onDrag.subscribe(function (e, dd) {
//            if (dd.mode != "recycle") {
//                return;
//            }
//            dd.helper.css({top: e.pageY + 5, left: e.pageX + 5});
//        });
//
//        grid.onDragEnd.subscribe(function (e, dd) {
//            if (dd.mode != "recycle") {
//                return;
//            }
//            dd.helper.remove();
//            $(dd.available).css("background", "beige");
//        });
//        //End drag helper functions

        //Update the item when edited
        grid.onCellChange.subscribe(function (e, args) {
            grid.getOptions().editable=false;
            var src=args.item;
            $.post('/sg_edit', {grid_item: JSON.stringify(src)}, function(new_title){
                if(new_title!="fail"){
                    var i = src['id']+1;
                    while(data[i]['parent_uid'].indexOf(data[src['id']]['uid'])==0){
                        if(data[i]['parent_uid']==data[src['id']]['uid']){
                            data[i]['parent_uid']=new_title;
                            data[i]['uid']=new_title+ "/" + data[i]['name'];
                        }
                        else{
                            data[i]['parent_uid']=data[data[i]['parent']]['uid'];
                            data[i]['uid']=data[i]['parent_uid'] + "/" + data[i]['name'];
                        }
                        i++;
                    }
                    src['uid']=new_title;
                    dataView.updateItem(src.id, src);
                }
                else{
                    src['name']=src['uid'];
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
                    var i=args.row;
                    var counter = -1;
                    do{
                        counter+=1;
                        i+=1;
                    }
                    while(data[i] && data[i]['indent']>data[args.row]['indent'])

                    if (!item._collapsed) {
                        item._collapsed = true;
                    } else {
                        item._collapsed = false;
                        counter=-counter;
                    }

                    dataView.updateItem(item.id, item);
                    changeRowsCollapsed(counter, i);
                }
                e.stopImmediatePropagation();
            }
            grid.getOptions().editable=false;
        });

        //When a cell is double clicked, make it editable (unless it's uploads)
        grid.onDblClick.subscribe(function (e, args) {
            if(data[grid.getActiveCell().row]['uid']!="uploads" && grid.getActiveCell().cell==grid.getColumnIndex('name')){
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


    function sortHierarchy(){
        var sorted = data.sort(comparer);
        var hierarchical = [];
        buildHierarchy(sorted, hierarchical, undefined);
        return hierarchical;
    };

    function buildHierarchy(sorted, hierarchical, parent){
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
                buildHierarchy(sorted, hierarchical, sorted[i]);
            }
        }
    };


//Compare function
    function comparer(a, b) {
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
    function removeDraggerGuide () {
        $(".dragger-guide").removeClass("dragger-guide");
        $(".slick-viewport").removeClass("dragger-guide1")
    };

// Add a Blue Background to the drag destination row
    function draggerGuide(e, args, inserter) {
        removeDraggerGuide();
        dragParent=false;
        // If a target row exists
        if(inserter==null){
            $(".slick-viewport").addClass("dragger-guide1");
        }
        else{
            if (inserter['uid']!="uploads"){
                if(inserter['type']=='folder'){
                    dragParent = grid.getCellNode(dataView.getRowById(inserter['id']), 0).parentNode;
                }
                else{
                    try{
                        dragParent = grid.getCellNode(dataView.getRowById(inserter['parent']), 0).parentNode;
                    }
                    catch(err){
                    }
                }
            }
            if(dragParent){
                $(dragParent).addClass("dragger-guide");
            }
        }
    };

    function size_update (folder) {
        var size=0;
        for (var i=0; i<data.length; i++){
            if (data[i]['uid']==folder){
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
            grid.size_update(target['parent_uid']);
        }
    };

    function changeRowsCollapsed (num, position){
        numRowsCollapsed+=num;
    };

//Function called when sort is clicked
    function onSort(e, args){
        sortAsc = !sortAsc;
        sortcol = args.sortCol.field;
        var new_data = sortHierarchy();
        prep_java(new_data);
        dataView.setItems(data);
        grid.invalidate();
        grid.setSelectedRows([]);
        grid.render();
    }

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

    function rowMove (e, args, url, src, dest){
        removeDraggerGuide();
        console.log(dest);
//        $.post(url, {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
//            //Make sure move succeeds
//            if (response=="fail"){
//                alert("Move failed!");
//            }
//            else{
                for(var y=0; y<args.rows.length; y++){
                    var rows=[];
                    //Make sure all children move as well
                    var j = args.rows[y];
                    var stopRow;
                    do{
                        rows.push(j);
                        j+=1;
                        stopRow = j;
                    }while(data[j] && data[j]['indent']>data[args.rows[y]]['indent']);

                    //Update data
                    var extractedRows = [], left, right;

                    var insertBefore = args.insertBefore;
                    if (numRowsCollapsed!=0){
                        insertBefore = grid.getDataItem(args.insertBefore)['id'];
                    }

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

//                    Change parent uid and uid

                    var checker = {};
                    var old_path = extractedRows[0]['path'];

                    if (dest==null){
                        extractedRows[0]['path'] = [extractedRows[0]['uid']];
                        extractedRows[0]['parent_uid']="null";
                    }
                    else{
                        extractedRows[0]['parent_uid']=dest[dest.length-1];
                        extractedRows[0]['path'] = dest.slice();
                        extractedRows[0]['path'].push(extractedRows[0]['uid']);
                    }


                    var new_path = extractedRows[0]['uid'];
                    checker[old_path]=new_path;

                    if (extractedRows.length > 1){
                        for(var m=1; m<extractedRows.length; m++){
//                            extractedRows[m]['parent_uid']=checker[extractedRows[m]['parent_uid']];
//                            old_path=extractedRows[m]['uid'];
//                            extractedRows[m]['uid']=extractedRows[m]['parent_uid']+'/'+extractedRows[m]['name'];
//                            checker[old_path]=extractedRows[m]['uid'];

                            var par = HGrid.getItemByValue(extractedRows, extractedRows[m]['parent_uid'], 'uid')['path'];
                            extractedRows[m]['path']= par.slice();
                            extractedRows[m]['path'].push(extractedRows[m]['uid']);
                        }
                    }

                    data = left.concat(extractedRows.concat(right));

                    var selectedRows = [];
                    for (var i = 0; i < rows.length; i++)
                        selectedRows.push(left.length + i);

//                        grid.size_update(data[args.rows[y]]['parent_uid']);
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
//            }
//        });
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
                        prep_java(data);
                        var x = rowsToDelete[0];
                        dataView.setItems(data);
                        grid.invalidate();
                        grid.setSelectedRows([]);
                        grid.render();
                    }
                });
            }
        });
