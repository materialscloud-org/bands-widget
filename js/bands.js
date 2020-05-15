
let plots = {};

function changeBandPath (textBoxId, plotInfoId) {
    let theTextBox = document.getElementById(textBoxId);
    let string = theTextBox.value;
    let finalPath = getPathArrayFromPathString(string);
    plots[plotInfoId].plotObj.updateBandPlot(finalPath);
}

function resetDefaultBandPath (textBoxId, plotInfoId) {
    let theTextBox = document.getElementById(textBoxId);
    theTextBox.value = getPathStringFromPathArray(plots[plotInfoId].jsondata.path);
    plots[plotInfoId].plotObj.updateBandPlot(plots[plotInfoId].jsondata.path, true);
}

function bandPlot(bandDivId, bandPathTextBoxId, dataFilePath) {
    $.getJSON(dataFilePath, function (data) {

        plots[bandDivId] = {};

        plots[bandDivId].jsondata = data;

        let theBandPlot = new BandPlot(bandDivId);

        theBandPlot.setData(data);
        theBandPlot.updateBandPlot();
        let theTextBox = document.getElementById(bandPathTextBoxId);
        theTextBox.value = getPathStringFromPathArray(data.path);

        let helperString = "Use - to define a segment<br>Use | to split the path.<br>Valid point names:<br>";
        let validPoints = getValidPointNames(data);
        helperString += validPoints.join(', ');

        plots[bandDivId].plotObj = theBandPlot;

        //theTextBox.tooltip({title: helperString, html: true})
        //    .tooltip('show'); // Open the tooltip


    });
}

$( document ).ready(function() {
    bandPlot("band1", "bandPathTextBox1", "data/382.json");
    bandPlot("band2", "bandPathTextBox2", "data/467.json");
});

