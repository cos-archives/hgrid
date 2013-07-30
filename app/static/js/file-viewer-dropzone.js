function hGridDropInit(hGrid){// Turn off the discover option so the URL error is not thrown with custom configuration
    var Dropzone = window.Dropzone;
    Dropzone.autoDiscover = false;
    var dropDestination;
    var url;
    var bool = false;
// Instantiate this Dropzone
    if(typeof hGrid.options['urlAdd'] === "string"){
        url = hGrid.options['urlAdd'];
    }
    else {
        url = "null";
        bool = true;
    }
    var myDropzone = new Dropzone(hGrid.options.container, {
        url: url
//    url: hGrid.options['urlAdd']
//    previewsContainer: "#drop-preview-panel"
    } );
// Get the SlickGrid Row under the dragged file
    myDropzone.on("dragover", function(e){

        currentDropCell = hGrid.Slick.grid.getCellFromEvent(e);
        if(currentDropCell===null){
            dropHighlight = null;
            dropDestination = null;
        }
        else{
            currentDropCell.insertBefore = currentDropCell['row'];

            if(hGrid.data[currentDropCell['row']-1] && hGrid.data[currentDropCell['row']-1]['type']=='folder'){
                dropDestination = hGrid.data[currentDropCell['row']-1]['uid'];
            }
            else{
                dropDestination = hGrid.data[currentDropCell['row']]['parent_uid'];
            }
            dropHighlight = null;
            if (hGrid.data[currentDropCell['row']-1]){
                dropHighlight = hGrid.data[currentDropCell['row']-1];
            };
        }
        if(bool){
            console.log(dropDestination);
            myDropzone.options.url = hGrid.options['urlAdd'][dropDestination];
        }
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
        console.log(file);
        hGrid.removeDraggerGuide();
        // Assign values to the uploads folder, so we can insert the file in the correct spot in the view
        var uploadsFolder = {};
        // Check if the server says that the file exists already
        if (file.xhr.response == "Repeat") {
            console.log("The File already exists!");
            // It is a new file
        } else{
            // Collect the JSON Response from the uploader
            var newSlickInfo = JSON.parse(file.xhr.response);
            // Assign response data to slickItem
            var slickTitle = newSlickInfo[0].name;
            var slickSize = newSlickInfo[0].size;
            var slickParentUid = newSlickInfo[0].parent_uid;
            if (slickParentUid===""){
                slickParentUid="null";
            }
            var slickUid = newSlickInfo[0].uid;
            var slickItem = {
                name: slickTitle,
                size: slickSize,
                parent_uid: slickParentUid,
                uid: slickUid,
                type: "file"
            }
            hGrid.uploadItem(slickItem);
        }
    });
};