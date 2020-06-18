
plots = {};

//It updates the band graph for user input.
function changeBandPath (textBoxId, plotInfoId) {
    var theTextBox = document.getElementById(textBoxId);
    var string = theTextBox.value;
    var finalPath = getPathArrayFromPathString(string);
    plots[plotInfoId].plotObj.updateBandPlot(finalPath);
}

//It updates the band graph for to its default path.
function resetDefaultBandPath (textBoxId, plotInfoId) {
    var theTextBox = document.getElementById(textBoxId);
    theTextBox.value = getPathStringFromPathArray(plots[plotInfoId].plotObj.getDefaultPath());
    plots[plotInfoId].plotObj.updateBandPlot(plots[plotInfoId].plotObj.getDefaultPath(), true);
}

// get json data and create band plot
function bandPlot(bandDivId, bandPathTextBoxId, dataFilePaths, colorInfo) {
    plots[bandDivId] = {};

    // create band plot object
    var theBandPlot = new BandPlot(bandDivId);
    var colorDict;

    // add data for every band structure
    dataFilePaths.forEach(function(dataFilePath, dataIdx) {
        $.ajax({
            url: dataFilePath,
            async: false,
            success: function (data) {
                // The color should be the same for all bands even if there are spin up and down, but different
                // for the two datasets

                // User can pass array of 3 colors: ['Single', 'Up', 'Down']
                // e.g. theBandPlot.addBandStructure(data, ['Single', 'Up', 'Down'])
                //  - Single' color will be used when there is no up/down bands
                //  - 'Up' color for spin up bands
                //  - 'Down' color of spin down bands

                var colorDict;
                if(colorInfo !== undefined) {
                    var newColor = tinycolor(colorInfo[dataIdx]);
                    colorDict = [newColor.toHexString(), newColor.darken(20).toHexString(), newColor.brighten(20).toHexString()];
                }

                theBandPlot.addBandStructure(data, colorDict);
            }
        });    
    });

    // update band structure data for plotting
    theBandPlot.updateBandPlot();

    var theTextBox = document.getElementById(bandPathTextBoxId);
    theTextBox.value = getPathStringFromPathArray(theBandPlot.getDefaultPath());

    var helperString = "Use - to define a segment<br>Use | to split the path.<br>Valid point names:<br>";
    var validPoints = getValidPointNames(theBandPlot.allData);
    helperString += validPoints.join(', ');

    plots[bandDivId].plotObj = theBandPlot;

    $(theTextBox).data('bs.tooltip', false).tooltip({title: helperString, html: true})
                            .tooltip('show'); // Open the tooltip
}

$( document ).ready(function() {
    bandPlot("band1", "bandPathTextBox1", ["data/291.json"]);
    //bandPlot("band2", "bandPathTextBox2", ["data/382.json", "data/467.json", "data/291-modified.json"]);
    //bandPlot("band3", "bandPathTextBox3", ["data/291-modified.json", "data/467.json"]);

    // pass colorInfo to plot bands
    //var colorInfo = ["#e41a1c", tinycolor("#e41a1c").darken(20).toHexString()];
    //bandPlot("band4", "bandPathTextBox4", ["data/291-modified.json", "data/467.json"], colorInfo);

});
