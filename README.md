Materials Cloud bands structure widget
=======================================

Library to plot bands structures using chartjs library.

## Installation

To include it via ```<script>```tag, make sure to include:

```javascript
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.3"></script>
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@0.7.7"></script>
<script src="js/tinycolor.min.js"></script>
<script src="dist/bandstructure.min.js"></script>
```

## Configuration

To plot below band structure, create the files bands.html and bands.js as
shown below.

#### Output:

![bands structure](https://raw.githubusercontent.com/materialscloud-org/bands-widget/master/images/bands.png?token=AF67DNFJTHXB3NYRN4SSWUK7D7MIS)

1. bands.html

```html
<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8">

  <title>Materials Cloud Bands Widget</title>
  <meta name="description" content="">
  <meta name="author" content="SitePoint">

  <link rel="stylesheet" href="css/mcloud_theme.min.css">
  <link rel="stylesheet" href="css/bands.css">

</head>

<body>

<!-- Band data -->
<div id="band-container" style="overflow-x: auto;">
  <div id="band-metadata">
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
          <h3>Band Structure</h3>

          <div>
          <!-- it's essential to put an empty div around the canvas when using a non-forced aspect ratio:
          https://stackoverflow.com/questions/45427088/chart-js-is-always-increasing-height-on-chart-resize
          or https://stackoverflow.com/questions/40263891/canvas-static-height-chartjs
          height can then be specified in the canvas
          -->
          <canvas id="band1" height="400px">
          </canvas>
          </div>

          <p class="input-group input-group-div">
            <span class="input-group-addon">Edit the path: </span>
            <input id="bandPathTextBox1" class="input-group form-control input-path"
                   autocomplete="off" onkeyup="changeBandPath('bandPathTextBox1', 'band1')">
          </p>
          <button type="button" class="btn btn-primary btn-md reset-path-btn" title="Reset to default path"
                  onclick="resetDefaultBandPath('bandPathTextBox1', 'band1')">
            Reset default path
          </button>
          <button type="button" class="btn btn-primary btn-md reset-path-btn" title="Reset zoom"
                  onclick="resetZoom('band1')">
            Reset zoom
          </button>
          <div class="btn-group" role="group" aria-label="zoom-pan-mode">
            <button type="button" class="btn btn-primary" id="band1Zoom" onclick="dragToZoom('band1', 'band1Zoom', 'band1Pan')">Drag (or pinch) to zoom</button>
            <button type="button" class="btn btn-default" id="band1Pan" onclick="dragToPan('band1', 'band1Zoom', 'band1Pan')">Drag to pan</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>


<script src="js/jquery-3.5.1.min.js"></script>
<script src="js/jquery-ui.min.js"></script>
<script src="js/bootstrap.min.js"></script>

<script src="js/tinycolor.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.3"></script>
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@0.7.7"></script>
<script src="dist/bandstructure.min.js"></script>

<script src="js/bands.js"></script>
</body>
</html>

```

2. bands.js

```javascript

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

//It updates the band graph for to its default path.
function resetZoom (plotInfoId) {
    // Note: call the resetZoom of he plotObj, not directly the call of the plotObj.myChart
    plots[plotInfoId].plotObj.resetZoom();
}

// Swiches to drag-to-zoom mode
function dragToZoom (plotInfoId, zoomButtonId, panButtonId) {
    $("#"+zoomButtonId).addClass('btn-primary');
    $("#"+zoomButtonId).removeClass('btn-default');
    $("#"+panButtonId).addClass('btn-default');
    $("#"+panButtonId).removeClass('btn-primary');

    plots[plotInfoId].plotObj.myChart.options.pan = {
        enabled: false,
        mode: "y"
    };
    plots[plotInfoId].plotObj.myChart.options.zoom = {
        enabled: true,
        mode: "y",
        drag: true
    };
    plots[plotInfoId].plotObj.myChart.update();
}

// Swiches to drag-to-zoom mode
function dragToPan (plotInfoId, zoomButtonId, panButtonId) {
    $("#"+panButtonId).addClass('btn-primary');
    $("#"+panButtonId).removeClass('btn-default');
    $("#"+zoomButtonId).addClass('btn-default');
    $("#"+zoomButtonId).removeClass('btn-primary');

    plots[plotInfoId].plotObj.myChart.options.pan = {
        enabled: true,
        mode: "y"
    };
    plots[plotInfoId].plotObj.myChart.options.zoom = {
        enabled: false,
        mode: "y",
        drag: true
    };
    plots[plotInfoId].plotObj.myChart.update();
}

// get json data and create band plot
function bandPlot(bandDivId, bandPathTextBoxId, dataFilePaths, colorInfo) {
    plots[bandDivId] = {};

    // create band plot object
    var theBandPlot = new BandPlot(bandDivId, 5.1, {"ymin": -20, "ymax": 32});
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

    var helperString = "Use - to define a segment<br>Use | to split the path.<br>Valid k-point names:<br>";
    var validPoints = getValidPointNames(theBandPlot.allData);
    helperString += validPoints.join(', ');

    plots[bandDivId].plotObj = theBandPlot;

    $(theTextBox).data('bs.tooltip', false).tooltip({title: helperString, html: true})
                            .tooltip('show'); // Open the tooltip

}

$( document ).ready(function() {
    bandPlot("band1", "bandPathTextBox1", ["data/b2y_entangled_SM_02.json", "data/b2y_dft.json"]);
});

```
