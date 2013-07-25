/**
 * Prototype for creating a Hierarchical Grid Structure
 *
 * @class HGrid
 * @author Jake Rosenberg
 * @author Alexander Ferguson
 */
var HGrid = {
    //Gives each div a class based on type (folder or file)
    defaultOptions: {
        container: null,
        url: null,
        info: null,
        columns: [
            {id: "uid", name: "uid", width: 40, field: "uid"},
            {id: "name", name: "Name", field: "name", width: 450, cssClass: "cell-title", editor: Slick.Editors.Text, sortable: true, defaultSortAsc: true}
        ],
        editable: false,
        enableCellNavigation: true,
        asyncEditorLoading: false,
        enableColumnReorder: true,
        sortAsc: true,
        dragDrop: true,
        navLevel: "null"
    },

    Slick: {
    },

    data: null,

    /**
     * This function creates a new HGrid object and calls initialize()
     * @constructor
     * @method create
     *
     * @param {Object} options Data to be passed to grid
     *   @param {String} options.url Url to post to
     *   @param {Object} options.info Information dictionary
     *     @param options.info.parent_uid Parent unique ID
     *     @param options.info.uid Unique ID
     *     @param options.info.name Name
     *     @param {String} options.info.type Folder or file
     *   @param {String} options.container Div ID of container for HGrid
     * @return {HGrid} Returns a new HGrid object.
     */
    create: function(options) {
        console.log("Starting create");
        var _this = this;
        var self = Object.create(_this);
        self.options = $.extend({}, self.defaultOptions, options);
        var urls = ['urlAdd','urlMove','urlEdit','urlDelete'];
        for (var i = 0; i<urls.length; i++) {
            if (!self.options[urls[i]]) {
                self.options[urls[i]] = self.options['url'];
            }
        }
        self.initialize();
        $.extend(this, {
            nameFunction: new self.Slick.Event(),
            hGridBeforeMove: new self.Slick.Event(),
            hGridAfterMove: new self.Slick.Event(),
            hGridBeforeEdit: new self.Slick.Event(),
            hGridAfterEdit: new self.Slick.Event(),
            hGridBeforeDelete: new self.Slick.Event(),
            hGridAfterDelete: new self.Slick.Event(),
            hGridBeforeAdd: new self.Slick.Event(),
            hGridAfterAdd: new self.Slick.Event(),
            hGridBeforeNavFilter: new self.Slick.Event(),
            hGridAfterNavFilter: new self.Slick.Event()
        });
        console.log("Ending create");
        return self;
    },

    initialize: function() {
        var hGridContainer = this.options.container;
        var hGridInfo = this.options.info;
        var hGridColumns = this.options.columns;
        this.data = this.prep(hGridInfo);
        this.Slick = $.extend({}, Slick)
        this.Slick.dataView = new this.Slick.Data.DataView({ inlineFilters: true });
//        this.Slick.dataView = $.extend({}, Slick.Data.DataView({ inlineFilters: true }));
//        this.Slick.dataView = new Slick.Data.DataView({ inlineFilters: true });
        this.Slick.dataView.beginUpdate();
        this.Slick.dataView.setItems(this.data);
        var data = this.data;
        var dataView = this.Slick.dataView;
        this.Slick.dataView.setFilterArgs([data, this]);
        this.Slick.dataView.setFilter(this.myFilter);
        this.Slick.dataView.endUpdate();
        if(this.options.dragDrop){
            hGridColumns.unshift({id: "#", name: "", width: 40, behavior: "selectAndMove", selectable: false, resizable: false, cssClass: "cell-reorder dnd"});
        }
        this.Slick.grid = new this.Slick.Grid(hGridContainer, this.Slick.dataView, hGridColumns, this.options);

        if(this.options.columns===this.defaultOptions.columns) {
            this.options.columns[this.Slick.grid.getColumnIndex('name')].formatter = this.defaultTaskNameFormatter;
        }
        this.options.columns[this.Slick.grid.getColumnIndex('name')].validator = this.requiredFieldValidator;
        this.Slick.grid.invalidate();
        this.Slick.grid.render();

        this.setupListeners();
        hGridDropInit(this);
    },

    defaultTaskNameFormatter: function(row, cell, value, columnDef, dataContext) {
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

    requiredFieldValidator: function (value) {
        if (value == null || value == undefined || !value.length) {
            return {valid: false, msg: "This is a required field"};
        } else {
            return {valid: true, msg: null};
        }
    },

    myFilter: function (item, args) {
        var data = args[0];
        var _this = args[1];
        if (_this.options.navLevel != "null") {
            if (item["sortpath"].indexOf(_this.options.navLevel) != 0) {
                return false;
            }
        }
        if (item.parent != null) {
            var parent = _this.getItemByValue(data, item.parent_uid, 'uid');
            while (parent) {
                if (parent._collapsed) {
                    return false;
                }
                parent = _this.getItemByValue(data, parent.parent_uid, 'uid');
            }
        }
        return true;
    },
    navLevelFilter: function(itemUid) {
        var _this = this;
        var item = _this.getItemByValue(_this.data, itemUid, "uid");
        _this.hGridBeforeNavFilter.notify(item);
        var navReset = _this.options.navLevel;
        if (item) {
            try {
                _this.options.navLevel = item["sortpath"];
                if(!item["sortpath"]) throw "This item has no sort path";
            } catch(e) {
                console.error(e);
                console.log("This is not a valid item");
                _this.options.navLevel = navReset;
            }
        } else {
            _this.options.navLevel = "null";
        }
        _this.Slick.dataView.setFilter(_this.myFilter);
        _this.hGridAfterNavFilter.notify(item);
    },

    /**
     * Allows the user to add a new item to the grid
     * @method addItem
     *
     * @param {Object} item New item to be added
     *  @param item.parent_uid Parent unique ID
     *  @param item.uid Unique ID
     *  @param item.name Name
     *  @param {String} item.type Folder or file
     * @return {Boolean}
     */
    addItem: function(item) {
        var _this = this;
//        if (!item['parent_uid'] || !item['uid'] || !item['name'] || !item['type'] || _this.getItemByValue(_this.data, item['uid'], 'uid')){
//            alert("This is an invalid item.");
//            return;
//        }
        var parent= _this.getItemByValue(_this.data, item['parent_uid'], 'uid');
        var value = {'item': item, 'parent':parent};
        var event_status = _this.hGridBeforeAdd.notify(value);
        if(event_status || typeof(event_status)==='undefined'){
            if(item['parent_uid']!="null"){
                var parent_path = parent['path'];
                item['path']=[];
                item['path'].concat(parent_path, item['uid']);
                item['sortpath']=item['path'].join('/');
            }
            _this.data.splice(parent['id']+1, 0,item);
            _this.prepJava(_this.data);
            _this.Slick.dataView.setItems(_this.data);
            _this.Slick.grid.invalidate();
            _this.Slick.grid.setSelectedRows([]);
            _this.Slick.grid.render();
            value['success'] = true;
            _this.hGridAfterAdd.notify(value);
            return true;
        }
        else{
            value['success'] = false;
            _this.hGridAfterAdd.notify(value);
            return false;
        }
    },

    /**
     * Allows the user to move items and all of their children to another place on the grid
     * @method moveItems
     *
     * @param {Array} src_uid Unique IDs of each item that should move
     * @param {int} dest Unique ID of the destination parent
     *
     * @return {Boolean}  True if success, false if failure
     */
    moveItems: function(src_uid, dest) {
        var _this = this;
        var src_id = [];
        var destination = _this.getItemByValue(_this.data, dest, 'uid');
        var dest_path = destination['path'];
        var url = _this.options.url;

        var value = {};
        value['rows']=[];
        for(var i=0; i<src_uid.length; i++){
            if ($.inArray(src_uid[i], dest_path)!=-1){
                return false;
            }
            value['rows'].push(src_uid[i]);
        }

        value['insertBefore']=destination['id']+1;
        var event_status = _this.hGridBeforeMove.notify(value);
        if(event_status || typeof(event_status)==='undefined'){
            if(_this.itemMover(value, url, src_id, dest_path)){
                console.log("here");
                value['success']=true;
                _this.hGridAfterMove.notify(value);
                return true;
            }
            else {
                value['success']="There was an error with the grid";
                _this.hGridAfterMove.notify(value);
                return false;
            }
        }
        else{
            value['success']=false;
            _this.hGridAfterMove.notify(value);
            return false;
        }
    },

    /**
     * Allows the user to delete items and all of their children
     * @method deleteItems
     *
     * @param {Array} rowsToDelete Array of unique IDs of rows to delete
     * @return {Boolean}
     */
    deleteItems: function(rowsToDelete) {
        var _this = this;
        //Splice data and delete all children if folder is dropped
        var value = {'items': []};
        for (var j=0; j<rowsToDelete.length; j++){
            value['items'].push(_this.getItemByValue(_this.data, rowsToDelete[i], 'uid'));
        }
        var event_status = _this.hGridBeforeDelete.notify(value);
        if(event_status || typeof(event_status)==='undefined'){
            for(var i=0; i<rowsToDelete.length; i++){
                var rows=[];
                var check = _this.Slick.dataView.getRowById(_this.getItemByValue(_this.data, rowsToDelete[i], 'uid')['id']);
                var j = check;
                do{
                    rows.push(j);
                    j+=1;
                }while(_this.data[j] && _this.data[j]['indent']>_this.data[check]['indent']);

                _this.data.splice(rows[0], rows.length);
                _this.Slick.dataView.setItems(_this.data);
            }
            _this.prepJava(_this.data);
            _this.Slick.dataView.setItems(_this.data);
            _this.Slick.grid.invalidate();
            _this.Slick.grid.setSelectedRows([]);
            _this.Slick.grid.render();
            value['success']=true;
            _this.hGridAfterDelete.notify(value);
            return true;
        }
        else{
            value['success']=false;
            _this.hGridAfterDelete.notify(value);
            return false;
        }
    },

    /**
     * Allows the user to edit the name of the item passed
     * @method editItem
     *
     * @param src_uid Unique ID of the item to change
     * @param {String} name New name for the item being changed
     *
     * @return {Boolean}
     */
    editItem: function(src_uid, name) {
        var src = this.getItemByValue(this.data, src_uid, 'uid');
        var value = {'item': src, 'name': name};
        var event_status = this.hGridBeforeEdit.notify(value);
        if(event_status || typeof(event_status)==='undefined'){
            src['name']=name;
            this.Slick.dataView.updateItem(src['id'], src);
            value['success']=true;
            this.hGridAfterEdit.notify(value);
            return true;
        }
        else{
            value['success']=false;
            this.hGridAfterEdit.notify(value);
            return false;
        }
    },

    getItemByValue: function(data, searchVal, searchProp) {
        var ans;
        for(var i =0; i<data.length; i++){
            if(data[i][searchProp]==searchVal){
                ans=data[i];
                return ans;
            }
        }
        return false;
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
                if(d['type']==='folder'){
                    d._collapsed=true;
                }
                output[data_counter]=d;
                data_counter++;
                info.splice(i, 1);
            }
            else if(info[i]['parent_uid'] in checker){
                d['parent']=checker[d['parent_uid']][1];
                d['indent']=checker[d['parent_uid']][0]+1;
                d['id']=data_counter;
                checker[d['uid']]=[d['indent'], data_counter];
                if(d['type']==='folder'){
                    d._collapsed=true;
                }
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
            if(_this.options.sortAsc){
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
            var parent;
            var d = {};
            var path = [];

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
                //Make sure parent_uid is in checker
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
//        $.post(url, {src: JSON.stringify(src), dest: JSON.stringify(dest)}, function(response){
//            //Make sure move succeeds
//            if (response=="fail"){
//                alert("Move failed!");
//                return false;
//            }
//            else{

        for(var y=0; y<args.rows.length; y++){
            var rows=[];
            //Make sure all children move as well
            var item = this.getItemByValue(this.data, args.rows[y], 'uid');
            var j = item['id'];
            var stopRow;
            do{
                rows.push(j);
                j+=1;
                stopRow = j;
            }while(this.data[j] && this.data[j]['indent']>item['indent']);

            //Update data
            var extractedRows = [], left, right;

            var insertBefore = this.Slick.grid.getDataItem(args.insertBefore)['id'];


            left = this.data.slice(0, insertBefore);
            right = this.data.slice(insertBefore, this.data.length);

            rows.sort(function(a,b) { return a-b; });

            for (var i = 0; i < rows.length; i++) {
                extractedRows.push(this.data[rows[i]]);
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
                    var par = this.getItemByValue(extractedRows, extractedRows[m]['parent_uid'], 'uid')['path'];
                    extractedRows[m]['path']= par.slice();
                    extractedRows[m]['path'].push(extractedRows[m]['uid']);
                    extractedRows[m]['sortpath']=extractedRows[m]['path'].join('/');
                }
            }

            this.data = left.concat(extractedRows.concat(right));

            var selectedRows = [];
            for (var i = 0; i < rows.length; i++)
                selectedRows.push(left.length + i);

            var new_data = this.prepJava(this.data);
            this.data = new_data;
        }
        this.Slick.dataView.setItems(this.data);
        this.Slick.grid.invalidate();
        this.Slick.grid.setSelectedRows([]);
        this.Slick.grid.render();
        return true;
    },

    removeDraggerGuide: function() {
        var _this = this;
        $(_this.options.container).find(".dragger-guide").removeClass("dragger-guide");
        $(_this.options.container).find(".slick-viewport").removeClass("dragger-guide1");
    },

    draggerGuide: function(inserter) {
        var _this = this;
        _this.removeDraggerGuide();
        var dragParent=false;
        // If a target row exists
        if(inserter==null){
            $(_this.options.container).find(".slick-viewport").addClass("dragger-guide1");
        }
        else{
            if (inserter['uid']!="uploads"){
                if(inserter['type']=='folder'){
                    dragParent = _this.Slick.grid.getCellNode(_this.Slick.dataView.getRowById(inserter['id']), 0).parentNode;
                }
                else{
                    try{
                        dragParent = _this.Slick.grid.getCellNode(_this.Slick.dataView.getRowById(inserter['parent']), 0).parentNode;
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
        this.options.sortAsc = !this.options.sortAsc;
        var sortingCol = args.sortCol.field;
        var sorted = this.sortHierarchy(data, sortingCol, dataView, grid);
        var new_data = this.prepJava(sorted);
        this.data = new_data;
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
            if(_this.options.sortAsc){
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
            }
        }
    },

    setupListeners: function(){
        var _this = this;
        var grid = this.Slick.grid;
        var data = this.data;
        var dataView = this.Slick.dataView;
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
                    return false;
                }
            }

            if(inserter!=null){
                if(inserter['type']=='folder'){
                    dest = inserter['path'];
                }
                else{
                    dest = _this.getItemByValue(data, inserter['parent_uid'], 'uid');
                    dest = dest['path'];
                }
            }
            else{
                dest = null;
            }

            for (var i = 0; i < args.rows.length; i++) {
                src[i]=_this.getItemByValue(_this.data, _this.Slick.dataView.getItem(args.rows[i])['id'], 'id')['path'];
//                src[i]=args.rows[i];
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
                if (args.rows[i] == insertBefore - 1 || index == false || src[i] == "uploads" || dest == "uploads") {
                    _this.removeDraggerGuide();
                    return false;
                }
            }
            return true;
        });

//        When rows are moved post to server and update data
        moveRowsPlugin.onMoveRows.subscribe(function(e, args){
            var src_id = [];
            for(var i=0; i<src.length; i++){
                src_id.push(src[i][src[i].length-1]);
            }

            var value = {};
            value['rows']=[];
            for(var j=0; j<src_id.length; j++){
                value['rows'].push(src_id[j]);
            }
            value['insertBefore']=args['insertBefore'];
            var event_status = _this.hGridBeforeMove.notify(value);
            if(event_status || typeof(event_status)==='undefined'){
                _this.itemMover(value, "/sg_move", src, dest);
                value['success']=true;
                _this.hGridAfterMove.notify(value, e);
            }
            else {
                _this.removeDraggerGuide();
                alert("Move failed");
                value['success']=false;
                _this.hGridAfterMove.notify(value, e);
            }
        });

        grid.registerPlugin(moveRowsPlugin);

        //Update the item when edited
        grid.onCellChange.subscribe(function (e, args) {
            _this.options.editable=false;
            var src=args.item;
            console.log(args);
            _this.Slick.dataView.updateItem(src.id, src);
//            $.post('/sg_edit', {grid_item: JSON.stringify(src)}, function(new_title){
//                if(new_title!="fail"){
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
                    while(data[i] && data[i]['indent']>data[args.row]['indent']);

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
            grid.render();
        });

        //When sort is clicked, call sort function
        grid.onSort.subscribe(function (e, args) {
            _this.onSort(e, args, grid, dataView, data);
        });

        //When a cell is double clicked, make it editable (unless it's uploads)
        grid.onDblClick.subscribe(function (e, args) {
            if(data[grid.getActiveCell().row]['uid']!="uploads" && grid.getActiveCell().cell==grid.getColumnIndex('name')){
                grid.getOptions().editable=true;
            }
        });
    }
};

