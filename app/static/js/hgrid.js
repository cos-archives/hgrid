var HGrid = {
    //Gives each div a class based on type (folder or file)
    defaultOptions: {
        container: null,
        url: null,
//        add_url: getUrl,
//        move_url: this.getUrl,
//        delete_url: this.getUrl,
//        edit_url: this.getUrl,
        info: null,
        columns: [
            {id: "#", name: "", width: 40, behavior: "selectAndMove", selectable: false, resizable: false, cssClass: "cell-reorder dnd"},
            {id: "id", name: "id", width: 40, field: "id"},
            {id: "name", name: "Name", field: "name", width: 450, cssClass: "cell-title", editor: Slick.Editors.Text, sortable: true, defaultSortAsc: true}
        ],
        editable: false,
        enableCellNavigation: true,
        asyncEditorLoading: false,
        enableColumnReorder: true
    },

    Slick: {
    },

    data: null,

    sortAsc: true,

    create: function(options) {
        var self = Object.create(this);
        self.options = $.extend(true, this.defaultOptions, options);
        //self.slickgrid = new Slick.Grid(hGridContainer, dataView, hGridColumns, options)
        self.initialize();
        return self;
    },

    initialize: function() {
        var hGridContainer = this.options.container;
        var hGridInfo = this.options.info;
        var hGridColumns = this.options.columns;
        this.data = this.prep(hGridInfo);
        this.Slick.dataView = new Slick.Data.DataView({ inlineFilters: true });
//        this.setData(this.prep(hGridInfo));
//        this.setDataView(new Slick.Data.DataView({ inlineFilters: true }));
//        HGrid.setData(this.prep(hGridInfo));
//        HGrid.setDataView(new Slick.Data.DataView({ inlineFilters: true }));
        this.Slick.dataView.beginUpdate();
        this.Slick.dataView.setItems(this.data);
        var data = this.data;
        var dataView = this.Slick.dataView;
        this.Slick.dataView.setFilterArgs([data, dataView, this]);
        this.Slick.dataView.setFilter(this.myFilter);
        this.Slick.dataView.endUpdate();
        this.Slick.grid = new Slick.Grid(hGridContainer, this.Slick.dataView, hGridColumns, this.options);
//        this.setGrid(new Slick.Grid(hGridContainer, this.Slick.dataView, hGridColumns, this.options));
//        HGrid.setGrid(new Slick.Grid(hGridContainer, this.Slick.dataView, hGridColumns, this.options));

        this.options.columns[this.Slick.grid.getColumnIndex('name')].formatter = this.TaskNameFormatter;
        this.options.columns[this.Slick.grid.getColumnIndex('name')].validator = this.requiredFieldValidator;
        this.Slick.grid.invalidate();
        this.Slick.grid.render();

        this.setupListeners();
//        hGridSlickInit(this.Slick.grid, this.Slick.dataView, this.data);
        hGridDropInit(hGridContainer);
        return this;
    },

    requiredFieldValidator: function (value) {
        if (value == null || value == undefined || !value.length) {
            return {valid: false, msg: "This is a required field"};
        } else {
            return {valid: true, msg: null};
        }
    },

    TaskNameFormatter: function (row, cell, value, columnDef, dataContext) {
        value = value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
        if (dataContext['type']=='folder') {
            if (dataContext._collapsed) {
                return spacer + " <span class='toggle expand'></span><span class='folder'></span>&nbsp;" + value;
            } else {
                return spacer + " <span class='toggle collapse'></span><span class='folder'></span>&nbsp;" + value;
            }
        } else {
            return spacer + " <span class='toggle spacer'></span>&nbsp;" + value;
        }
    },

    myFilter: function (item, args) {
        var data = args[0];
        var dataView = args[1];
        var _this = args[2];
        if (item.parent != null) {
//        var parentIdx = dataView.getIdxById(item.parent);
//        var parent = data[parentIdx];
            var parent = _this.getItemByValue(data, item.parent_uid, 'uid');
//            var parent = HGrid.getItemByValue(data, item.parent_uid, 'uid');
            while (parent) {
                if (parent._collapsed) {
                    return false;
                }
//            var parentParentIdx = dataView.getIdxById(parent.parent);
//            parent = data[parentParentIdx];
                parent = _this.getItemByValue(data, parent.parent_uid, 'uid');
//                parent = HGrid.getItemByValue(data, parent.parent_uid, 'uid');
            }
        }
        return true;
    },

    getData: function(){
        return this.data;
    },

    setData: function(data) {
        this.data = data;
    },

    getDataView: function() {
        return this.Slick.dataView;
    },

    setDataView: function(dataView) {
        this.Slick.dataView = dataView;
    },

    getGrid: function() {
        return this.Slick.grid;
    },

    setGrid: function(grid) {
        this.Slick.grid = grid;
    },

    addItem: function() {

    },

    moveItems: function(src, dest) {
        var _this = this;
        var src_uid = src;
        var dest = _this.getItemByValue(_this.data, dest, 'uid');
        var dest_path = dest['path'];
        var url = _this.options.url;

        var value = {};
        value['rows']=[];
        for(var j=0; j<src_uid.length; j++){
            value['rows'].push(src_uid[j]);
        }
        value['insertBefore']=dest['id']+1;

        _this.itemMover(value, url, src_uid, dest_path);
    },

    deleteItem: function() {

    },

    editItem: function(src_uid, name) {
        var src = this.getItemByValue(this.data, src_uid, 'uid');
        src['name']=name;
        this.Slick.dataView.updateItem(src['id'], src);
    },

    getItemByValue: function(data, searchVal, searchProp) {
        var ans;
        for(var i =0; i<data.length; i++){
            if(data[i][searchProp]==searchVal){
                ans=data[i];
                return ans;
            }
        }
    },

    getItemsByValue: function(data, searchVal, searchProp) {
        var propArray = [];
        for(var i =0; i<data.length; i++){
            if(data[i][searchProp]==searchVal){
                propArray.push(data[i]);
            }
        }
        return propArray;
    },

    prep: function(info){
        var indent = 0;
        var checker = {};
        var i = 0;
        var data_counter=0;
        var output = [];
        var _this = this;
        while (info.length>=1){

            var d = info[i];
            if (info[i]['parent_uid']=="null"){
                d['parent']=null;
                d['indent']=0;
                d['id']=data_counter;
                checker[d['uid']]=[d['indent'], data_counter];
                output[data_counter]=d;
                data_counter++;
                info.splice(i, 1);
            }
            else if(info[i]['parent_uid'] in checker){
                d['parent']=checker[d['parent_uid']][1];
                d['indent']=checker[d['parent_uid']][0]+1;
                d['id']=data_counter;
                checker[d['uid']]=[d['indent'], data_counter];
                output[data_counter]=d;
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

        for(var l=0; l<output.length; l++){
            var path = [];
            path.push(output[l]['uid']);
            if(output[l]['parent_uid']!="null"){
                for(var m=0; m<l; m++){
                    if(output[m]['uid']==output[l]['parent_uid']){
//                        var x = m;
                        while(output[m]['parent_uid']!="null"){
                            path.push(output[m]['uid']);
                            m = output[m]['parent'];
                        }
                        path.push(output[m]['uid']);
                        break;
                    }
                }
            }
            path.reverse();
            output[l]['path']=path;
            output[l]['sortpath']=path.join('/')
        }
        var sortingCol='sortpath';
        output.sort(function(a, b){
            var x = a[sortingCol], y = b[sortingCol];

            if(x == y){
                return 0;
            }
            if(_this.sortAsc){
//            if(HGrid.sortAsc){
                return x > y ? 1 : -1;
            }
            else{
                return x < y ? 1 : -1;
            }
        });
        return this.prepJava(output);
    },

    prepJava: function(sortedData) {
        var output = [];
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
            output[i]=d;
        }
        return output;
    },

    itemMover: function (args, url, src, dest){
        this.removeDraggerGuide();
//        HGrid.removeDraggerGuide();
//        $.post(url, {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
//            //Make sure move succeeds
//            if (response=="fail"){
//                alert("Move failed!");
//            }
//            else{
        console.log(args);
        console.log(src);
        console.log(dest);

        for(var y=0; y<args.rows.length; y++){
            var rows=[];
            //Make sure all children move as well
            var j = args.rows[y];
            var stopRow;
            do{
                rows.push(j);
                j+=1;
                stopRow = j;
            }while(this.data[j] && this.data[j]['indent']>this.data[args.rows[y]]['indent']);
//            }while(HGrid.data[j] && HGrid.data[j]['indent']>HGrid.data[args.rows[y]]['indent']);

            //Update data
            var extractedRows = [], left, right;

            var insertBefore = this.Slick.grid.getDataItem(args.insertBefore)['id'];
//            var insertBefore = HGrid.Slick.grid.getDataItem(args.insertBefore)['id'];


            left = this.data.slice(0, insertBefore);
            right = this.data.slice(insertBefore, this.data.length);
//            left = HGrid.data.slice(0, insertBefore);
//            right = HGrid.data.slice(insertBefore, HGrid.data.length);

            rows.sort(function(a,b) { return a-b; });

            for (var i = 0; i < rows.length; i++) {
                extractedRows.push(this.data[rows[i]]);
//                extractedRows.push(HGrid.data[rows[i]]);
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
                extractedRows[0]['sortpath']=extractedRows[0]['path'].join('/');
            }


            var new_path = extractedRows[0]['uid'];
            checker[old_path]=new_path;

            if (extractedRows.length > 1){
                for(var m=1; m<extractedRows.length; m++){
//                            extractedRows[m]['parent_uid']=checker[extractedRows[m]['parent_uid']];
//                            old_path=extractedRows[m]['uid'];
//                            extractedRows[m]['uid']=extractedRows[m]['parent_uid']+'/'+extractedRows[m]['name'];
//                            checker[old_path]=extractedRows[m]['uid'];

                    var par = this.getItemByValue(extractedRows, extractedRows[m]['parent_uid'], 'uid')['path'];
//                    var par = HGrid.getItemByValue(extractedRows, extractedRows[m]['parent_uid'], 'uid')['path'];
                    extractedRows[m]['path']= par.slice();
                    extractedRows[m]['path'].push(extractedRows[m]['uid']);
                    extractedRows[m]['sortpath']=extractedRows[m]['path'].join('/');
                }
            }

            this.data = left.concat(extractedRows.concat(right));
//            HGrid.data = left.concat(extractedRows.concat(right));

            var selectedRows = [];
            for (var i = 0; i < rows.length; i++)
                selectedRows.push(left.length + i);

//                        grid.size_update(data[args.rows[y]]['parent_uid']);
            var new_data = this.prepJava(this.data);
            this.data = new_data;
//            var new_data = HGrid.prepJava(HGrid.data);
//            HGrid.data = new_data;
        }
        //Update sizes
//                    for(var i=0; i<src.length; i++){
//                        grid.size_update(src[i])
//                    }
//                    grid.size_update(dest[0]);

        this.Slick.dataView.setItems(this.data);
        this.Slick.grid.invalidate();
        this.Slick.grid.setSelectedRows([]);
        this.Slick.grid.render();
//        HGrid.Slick.dataView.setItems(HGrid.data);
//        HGrid.Slick.grid.invalidate();
//        HGrid.Slick.grid.setSelectedRows([]);
//        HGrid.Slick.grid.render();
//            }
//        });
    },

    removeDraggerGuide: function() {
        $(".dragger-guide").removeClass("dragger-guide");
        $(".slick-viewport").removeClass("dragger-guide1");
    },

    draggerGuide: function(inserter) {
        var _this = this;
        _this.removeDraggerGuide();
//        HGrid.removeDraggerGuide();
        var dragParent=false;
        // If a target row exists
        if(inserter==null){
            $(_this.options.container + ".slick-viewport").addClass("dragger-guide1");
        }
        else{
            if (inserter['uid']!="uploads"){
                if(inserter['type']=='folder'){
                    dragParent = _this.Slick.grid.getCellNode(_this.Slick.dataView.getRowById(inserter['id']), 0).parentNode;
//                    dragParent = HGrid.Slick.grid.getCellNode(HGrid.Slick.dataView.getRowById(inserter['id']), 0).parentNode;
                }
                else{
                    try{
                        dragParent = _this.Slick.grid.getCellNode(_this.Slick.dataView.getRowById(inserter['parent']), 0).parentNode;
//                        dragParent = HGrid.Slick.grid.getCellNode(HGrid.Slick.dataView.getRowById(inserter['parent']), 0).parentNode;
                    }
                    catch(err){
                    }
                }
            }
            if(dragParent){
                $(dragParent).addClass("dragger-guide");
            }
        }
    },

    //Function called when sort is clicked
    onSort: function (e, args, grid, dataView, data){
        this.sortAsc = !this.sortAsc;
//        HGrid.sortAsc = !HGrid.sortAsc;
        var sortingCol = args.sortCol.field;
        var sorted = this.sortHierarchy(data, sortingCol, dataView, grid);
        var new_data = this.prepJava(sorted);
        this.data = new_data;
//        var new_data = HGrid.prepJava(sorted);
//        HGrid.data = new_data;
        dataView.setItems(new_data);
        grid.invalidate();
        grid.setSelectedRows([]);
        grid.render();
    },

    sortHierarchy: function (data, sortingCol, dataView, grid){
        var _this = this;
        var sorted = data.sort(function(a, b){
            var x = a[sortingCol], y = b[sortingCol];

            if(x == y){
                return 0;
            }
            if(_this.sortAsc){
//            if(HGrid.sortAsc){
                return x > y ? 1 : -1;
            }
            else{
                return x < y ? 1 : -1;
            }
        });
        var hierarchical = [];
        this.buildHierarchy(sorted, hierarchical, undefined);
        return hierarchical;
    },

    buildHierarchy: function (sorted, hierarchical, parent) {
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
                this.buildHierarchy(sorted, hierarchical, sorted[i]);
//                HGrid.buildHierarchy(sorted, hierarchical, sorted[i]);
            }
        }
    },

    setupListeners: function(){
        var _this = this;
        var grid = this.Slick.grid;
        var data = this.data;
        var dataView = this.Slick.dataView;
//        var grid = HGrid.Slick.grid;
//        var data = HGrid.data;
//        var dataView = HGrid.Slick.dataView;
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
                if(args.insertBefore==args.rows[0]+1){
                    inserter = grid.getDataItem(args.insertBefore-2);
                }
                else{
                    inserter = grid.getDataItem(args.insertBefore-1);
                }
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

            if(inserter!=null){
                if(inserter['type']=='folder'){
                    dest = inserter['path'];
                }
                else{
                    dest = _this.getItemByValue(data, inserter['parent_uid'], 'uid');
//                dest = HGrid.getItemByValue(data, inserter['parent_uid'], 'uid');
                    dest = dest['path'];
                }
            }
            else{
                dest = null;
            }

            for (var i = 0; i < args.rows.length; i++) {
                src[i]=_this.getItemByValue(_this.data, _this.Slick.dataView.getItem(args.rows[i])['id'], 'id')['path'];

                // no point in moving before or after itself
                for(var j=0; j<data.length; j++){
                    if(data[j]['id']==args.rows[i]){
//                        src[i] = data[j]['path'];
                    }
                    if(insertBefore>data.length-1){
                        var m = insertBefore;
                        if (data[m-1]){
                            if(data[m-1]['type']=='folder') {
//                                dest = data[m-1]['path'];
                            }
                            else{
                                var x = data[m-1]['parent_uid'];
//                                dest = _this.getItemByValue(data, x, 'uid')['path'];
//                                dest = HGrid.getItemByValue(data, x, 'uid')['path'];
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
                _this.draggerGuide(inserter);
//                HGrid.draggerGuide(inserter);
                if (args.rows[i] == insertBefore - 1 || index == false || src[i] == "uploads" || dest == "uploads") {
                    _this.removeDraggerGuide();
//                    HGrid.removeDraggerGuide();
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

            var value = {};
            value['rows']=[];
            for(var j=0; j<src_id.length; j++){
                value['rows'].push(src_id[j]);
            }
            value['insertBefore']=args['insertBefore'];

            _this.itemMover(value, "/sg_move", src_id, dest);
//            HGrid.itemMover(e, args, "/sg_move", src_id, dest);
        });

        grid.registerPlugin(moveRowsPlugin);

        //Update the item when edited
        grid.onCellChange.subscribe(function (e, args) {
            _this.options.editable=false;
//            HGrid.options.editable=false;
            var src=args.item;
            console.log(args);
            _this.Slick.dataView.updateItem(src.id, src);
//            $.post('/sg_edit', {grid_item: JSON.stringify(src)}, function(new_title){
//                if(new_title!="fail"){
//                    var i = src['id']+1;
//                    while(data[i]['parent_uid'].indexOf(data[src['id']]['uid'])==0){
//                        if(data[i]['parent_uid']==data[src['id']]['uid']){
//                            data[i]['parent_uid']=new_title;
//                            data[i]['uid']=new_title+ "/" + data[i]['name'];
//                        }
//                        else{
//                            data[i]['parent_uid']=data[data[i]['parent']]['uid'];
//                            data[i]['uid']=data[i]['parent_uid'] + "/" + data[i]['name'];
//                        }
//                        i++;
//                    }
//                    src['uid']=new_title;
//                    dataView.updateItem(src.id, src);
//                }
//                else{
//                    src['name']=src['uid'];
//                    alert("You can't change the uploads folder!");
//                    dataView.updateItem(src.id, src);
//                }
//            });
        });

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
                }
                e.stopImmediatePropagation();
            }
            grid.getOptions().editable=false;
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
            _this.options.columns=args.cols;
//            HGrid.options.columns=args.cols;
            grid.render();
        });

        //When sort is clicked, call sort function
        grid.onSort.subscribe(function (e, args) {
            _this.onSort(e, args, grid, dataView, data);
//            HGrid.onSort(e, args, grid, dataView, data);
        });

        //When a cell is double clicked, make it editable (unless it's uploads)
        grid.onDblClick.subscribe(function (e, args) {
            if(data[grid.getActiveCell().row]['uid']!="uploads" && grid.getActiveCell().cell==grid.getColumnIndex('name')){
                grid.getOptions().editable=true;
            }
        });
    }
}

