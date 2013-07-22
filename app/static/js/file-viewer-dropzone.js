function hGridDropInit(hGrid){// Turn off the discover option so the URL error is not thrown with custom configuration
Dropzone.autoDiscover = false;
    var dropDestination;
// Instantiate this Dropzone
var myDropzone = new Dropzone(hGrid.options.container, {
    url: "/uploader",
    previewsContainer: "#drop-preview-panel"
} );
// Get the SlickGrid Row under the dragged file
myDropzone.on("dragover", function(e){
    currentDropCell = hGrid.Slick.grid.getCellFromEvent(e);
    currentDropCell.insertBefore = currentDropCell['row'];

    if(hGrid.data[currentDropCell['row']-1]['type']=='folder'){
        dropDestination = hGrid.data[currentDropCell['row']-1]['uid'];
    }
    else{
    dropDestination = hGrid.data[currentDropCell['row']]['parent_uid'];
    }
    dropHighlight = null;
    if (hGrid.data[currentDropCell['row']-1]){
        dropHighlight = hGrid.data[currentDropCell['row']-1];
    };
    hGrid.draggerGuide(dropHighlight);
});

myDropzone.on("dragleave", function(e){
    hGrid.removeDraggerGuide();
});
// Pass the destination folder to the server
myDropzone.on("sending", function(file, xhr, formData){
    formData.append("destination", dropDestination);
});
// Hook the drop success to the grid view update
myDropzone.on("success", function(file) {
    // Assign values to the uploads folder, so we can insert the file in the correct spot in the view
    var uploadsFolder = {};
    // Check if the server says that the file exists already
    if (file.xhr.response == "Repeat") {
        console.log("The File already exists!");
        // It is a new file
    } else {
        // Loop through the data and find the destination folder
        for (var i = 0; i < hGrid.data.length; i++) {
//            if ((data[i]['name'] == "uploads") && (data[i]['parent'] == null)){
//            if ((data[i]['name'] == dropDestination)){
//                console.log(data[i]['name']);
            if ((hGrid.data[i]['uid'] == dropDestination)){
                console.log(hGrid.data[i]['uid']);
                uploadsFolder['id'] = hGrid.data[i]['id'];
                uploadsFolder['index'] = i;
                uploadsFolder['indent'] = hGrid.data[i]['indent'];
                // Collapse the uploads folder to get rid of glitches in the view render
//                data[i]._collapsed = true;
                hGrid.Slick.dataView.updateItem(hGrid.data[i]['id'], hGrid.data[i]);
            }
        }
        // Collect the JSON Response from the uploader
        var newSlickInfo = JSON.parse(file.xhr.response);
        // Assign response data to slickItem
        var slickTitle = newSlickInfo[0].name;
        var slickId = hGrid.data.length;
        var slickIndent = uploadsFolder['indent'] + 1;
        var slickSize = newSlickInfo[0].size;
        var slickParent = uploadsFolder['id'];
        var slickParentUid = newSlickInfo[0].parent_uid;
        var slickUid = newSlickInfo[0].uid;
        var slickItem = {
            name: slickTitle,
            size: slickSize,
            parent_uid: slickParentUid,
            parent: slickParent,
            uid: slickUid,
            id: slickId,
            indent: slickIndent
        }
        // Splice in the new row after the uploads folder
        hGrid.data.splice(uploadsFolder['index'] + 1, 0, slickItem);
        var new_id = uploadsFolder['id']+1;
        console.log(slickItem["uid"]);
        for(var x = uploadsFolder['index'] + 1; x<hGrid.data.length; x++){
            hGrid.data[x]['id']=new_id;
            new_id+=1;
            if(hGrid.data[x]['parent_uid']){
                for(var i=0; i<hGrid.data.length; i++){
                    if(hGrid.data[i]['uid']==hGrid.data[x]['parent_uid']){
                        hGrid.data[x]['parent']=hGrid.data[i]['id'];
                    }
                }
            }

        }
        console.log(hGrid.data);
        // Update the hGrid.Slick.dataView
        hGrid.Slick.dataView.beginUpdate();
        hGrid.Slick.dataView.setItems(hGrid.data);
        hGrid.Slick.dataView.endUpdate();
    }
    // Re-instantiate the grid
    hGrid.Slick.grid.updateRowCount();
    hGrid.Slick.grid.invalidate();
    hGrid.Slick.grid.render();
});
};