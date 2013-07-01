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
            if ((data[i]['title'] == "uploads") && (data[i]['parent'] == null)){
                console.log(data[i]['title']);
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
        var slickUnique = data.length;
        var slickIndent = 1;
        var slickSize = newSlickInfo[0].size;
        var slickParent = uploadsFolder['id'];
        var slickParentPath = newSlickInfo[0].uploader_path;
        var slickPath = newSlickInfo[0].path;
        var slickItem = {
            title: slickTitle,
            size: slickSize,
            parent_path: slickParentPath,
            parent: slickParent,
            path: slickPath,
            id: slickId,
            unique: slickUnique,
            indent: slickIndent,
            finish: "01/05/2009",
            start: "01/01/2009",
            percentComplete: 45
        }
        // Splice in the new row after the uploads folder
        data.splice(uploadsFolder['index'] + 1, 0, slickItem);
        // Update the dataView
        dataView.beginUpdate();
        dataView.setItems(data);
        dataView.setFilter(myFilter);
        dataView.endUpdate();
    }
    // Re-instantiate the grid
    grid.updateRowCount();
    grid.invalidate();
    grid.render()
});