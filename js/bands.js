
let plots = {};

function changeBandPath (textBoxId, plotInfoId) {
    let theTextBox = document.getElementById(textBoxId);
    let string = theTextBox.value;
    let finalPath = getPathArrayFromPathString(string);
    plots[plotInfoId].plotObj.updateBandPlot(finalPath);
}

function resetDefaultBandPath (textBoxId, plotInfoId) {
    let theTextBox = document.getElementById(textBoxId);
    theTextBox.value = getPathStringFromPathArray(plots[plotInfoId].plotObj.getDefaultPath());
    plots[plotInfoId].plotObj.updateBandPlot(plots[plotInfoId].plotObj.getDefaultPath(), true);
}

function bandPlot(bandDivId, bandPathTextBoxId, dataFilePaths) {
    plots[bandDivId] = {};
    let theBandPlot = new BandPlot(bandDivId);

    dataFilePaths.forEach(function(dataFilePath) {
        $.ajax({
            url: dataFilePath,
            async: false,
            success: function (data) {
                theBandPlot.addBandStructure(data);
            }
        });    
    });

    theBandPlot.updateBandPlot();
    let theTextBox = document.getElementById(bandPathTextBoxId);
    theTextBox.value = getPathStringFromPathArray(theBandPlot.getDefaultPath());

    let helperString = "Use - to define a segment<br>Use | to split the path.<br>Valid point names:<br>";
    let validPoints = getValidPointNames(theBandPlot.allData);
    helperString += validPoints.join(', ');

    plots[bandDivId].plotObj = theBandPlot;

    //theTextBox.tooltip({title: helperString, html: true})
    //    .tooltip('show'); // Open the tooltip
}

$( document ).ready(function() {
    bandPlot("band1", "bandPathTextBox1", ["data/382.json", "data/467.json"]);
    bandPlot("band2", "bandPathTextBox2", ["data/467.json"]);
});
