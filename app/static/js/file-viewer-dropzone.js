// Turn off the discover option so the URL error is not thrown with custom configuration
Dropzone.autoDiscover = false;
// Hook the drop success to the grid view update
myDropzone.on("success", function(file) {
    // Assign values to the uploads folder, so we can insert the file in the correct spot in the view
    var uploadsFolder = {};
    // Check if the server says that the file exists already
    if (file.xhr.response == "Repeat") {
        console.log("The File already exists!");
        // It is a new file
    } else {
        // Loop through the data and find the Uploads folder
        for (var i = 0; i < data.length; i++) {
            if ((data[i]['name'] == "uploads") && (data[i]['parent'] == null)){
                console.log(data[i]['name']);
                uploadsFolder['id'] = data[i]['id'];
                uploadsFolder['index'] = i;
                // Collapse the uploads folder to get rid of glitches in the view render
                data[i]._collapsed = true;
                dataView.updateItem(data[i]['id'], data[i]);
            }
        }
        // Collect the JSON Response from the uploader
        var newSlickInfo = JSON.parse(file.xhr.response);
        // Assign response data to slickItem
        var slickTitle = newSlickInfo[0].name;
        var slickId = data.length;
        var slickIndent = 1;
        var slickSize = newSlickInfo[0].size;
        var slickParent = uploadsFolder['id'];
        var slickParentPath = newSlickInfo[0].parent_path;
        var slickPath = newSlickInfo[0].path;
        var slickItem = {
            name: slickTitle,
            size: slickSize,
            parent_path: slickParentPath,
            parent: slickParent,
            path: slickPath,
            id: slickId,
            indent: slickIndent
        }
        // Splice in the new row after the uploads folder
        data.splice(uploadsFolder['index'] + 1, 0, slickItem);
        var new_id = uploadsFolder['id']+1;
        console.log(slickItem["path"]);
        for(var x = uploadsFolder['index'] + 1; x<data.length; x++){
            data[x]['id']=new_id;
            new_id+=1;
            if(data[x]['parent_path']){
                for(var i=0; i<data.length; i++){
                    if(data[i]['path']==data[x]['parent_path']){
                        data[x]['parent']=data[i]['id'];
                    }
                }
            }

        }
        console.log(data);
        // Update the dataView
        dataView.beginUpdate();
        dataView.setItems(data);
        dataView.setFilter(myFilter);
        dataView.endUpdate();
    }
    // Re-instantiate the grid
    grid.updateRowCount();
    grid.invalidate();
    grid.render();
});