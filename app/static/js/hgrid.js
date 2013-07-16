var HGrid = {
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
            {id: "name", name: "Name", field: "name", width: 450, cssClass: "cell-title", formatter: TaskNameFormatter, editor: Slick.Editors.Text, validator: requiredFieldValidator, sortable: true, defaultSortAsc: true}
        ]
    },

    Slick: {
    },

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
        this.Slick.dataView.beginUpdate();
        this.Slick.dataView.setItems(this.data);
        this.Slick.dataView.setFilterArgs([this.data, this.Slick.dataView]);
        this.Slick.dataView.setFilter(myFilter);
        this.Slick.dataView.endUpdate();
        this.Slick.grid = new Slick.Grid(hGridContainer, this.Slick.dataView, hGridColumns, this.options);
        this.setupListeners();
        hGridSlickInit(hGridInfo, hGridContainer, hGridColumns, this.Slick.grid, this.Slick.dataView);
        hGridDropInit(hGridContainer);
        return this;
    },

    getUrl: function() {
        return this.options.url;
    },

    addItem: function() {

    },

    getMoveItems: function(src, dest) {
        othervariable = this.moveItem();
    },

    moveItem: function(src, dest) {
        url = "/sg_move";
        var ans = function (e){
            var value = {};
            value.rows = [];
            for (var i=0; i<src.length; i++){
                for(var j=0; j<data.length; j++){
                    if(data[j]['path']==src[i]){
                        value.rows.push(j);
                    }
                    if(data[j]['path']==dest[0]){
                        value.insertBefore = j+1;
                    }
                }
            }
            rowMove(e, value, url, src, dest);
        }();
    },

    deleteItem: function() {

    },

    editItem: function() {

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
        if(this.sortAsc){
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

    setupListeners: function(){
                //Update the item when edited
        this.Slick.grid.onCellChange.subscribe(function (e, args) {
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
    }
}

