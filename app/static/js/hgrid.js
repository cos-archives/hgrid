var HGrid = {
    defaultOptions: {
        container: null,
        url: null,
//        add_url: getUrl,
//        move_url: this.getUrl,
//        delete_url: this.getUrl,
//        edit_url: this.getUrl,
        data: null,
        columns: [
            {id: "#", name: "", width: 40, behavior: "selectAndMove", selectable: false, resizable: false, cssClass: "cell-reorder dnd"},
            {id: "id", name: "id", width: 40, field: "id"},
            {id: "name", name: "Name", field: "name", width: 450, cssClass: "cell-title", formatter: TaskNameFormatter, editor: Slick.Editors.Text, validator: requiredFieldValidator, sortable: true, defaultSortAsc: true}
        ]
    },

    create: function(options) {
        var self = Object.create(this);
        self.options = $.extend(true, this.defaultOptions, options);
        //self.slickgrid = new Slick.Grid(hGridContainer, dataView, hGridColumns, options)
        self.initialize();
        return self;
    },

    initialize: function(options) {
        var hGridContainer = this.options.container;
        var hGridInfo = this.options.data;
        var hGridColumns = this.options.columns;
        hGridSlickInit(hGridInfo, hGridContainer, hGridColumns);
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
                ans = data[i];
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

    createPaths: function(data){
        for(var l=0; l<data.length; l++){
            var path = [];
            path.push(data[l]['uid']);
            if(data[l]['parent_uid']!="null"){
                for(var m=0; m<l; m++){
                    if(data[m]['uid']==data[l]['parent_uid']){
//                        var x = m;
                        while(data[m]['parent_uid']!="null"){
                            path.push(data[m]['uid']);
                            m = data[m]['parent'];
                        }
                        path.push(data[m]['uid']);
                        break;
                    }
                }
            }
            path.reverse();
            data[l]['path']=path;
            data[l]['sortpath']=path.join('/')
        }
    }
}

