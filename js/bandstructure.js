/**
 * Display Band structure(s) in single plot
 *
 * @author Giovanni Pizzi, EPFL (2018-2020)
 * @author Snehal Kumbhar, EPFL (2020)
 *
 * @version 1.0 First release to plot single band structure
 * @version 1.1 Added support to plot multiple band structures in single plot
 *
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c), 2018, ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE
 * (Theory and Simulation of Materials (THEOS) and National Centre for
 * Computational Design and Discovery of Novel Materials (NCCR MARVEL)),
 * Switzerland.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

// Utility 'zip' function analogous to python's, from
// https://stackoverflow.com/questions/4856717
var zip = function () {
    var args = [].slice.call(arguments);
    var shortest = args.length === 0 ? [] : args.reduce(function (a, b) {
        return a.length < b.length ? a : b;
    });

    return shortest.map(function (_, i) {
        return args.map(function (array) {
            return array[i];
        });
    });
};

// Utility function to convert a string in a array describing a path
function getPathStringFromPathArray(path) {
    var string = [];
    var lastPoint = "";
    path.forEach(function (thisPath) {
        if (string.length === 0) {
            string += thisPath[0];
            string += "-";
            string += thisPath[1];
        } else {
            if (lastPoint != thisPath[0]) {
                string += "|" + thisPath[0];
            }
            string += "-";
            string += thisPath[1];
        }
        lastPoint = thisPath[1];
    });

    return string;
}

// Utility function to convert an array describing a path in a short string
function getPathArrayFromPathString(pathString) {
    var finalPath = [];
    // Each path separated by | can be treated independently and appended
    var independentPieces = pathString.split("|");
    independentPieces.forEach(function (stringPiece) {
        // Split by dash
        pointsStrings = stringPiece.split('-');
        // remove unneeded spaces, remove empty items (so e.g. X--Y still works as X-Y)
        pointsTrimmedStrings = pointsStrings.map(function (pointName) {
            return pointName.trim();
        });
        points = pointsTrimmedStrings.filter(function (pointName) {
            return pointName !== "";
        });

        zip(points.slice(0, points.length - 1), points.slice(1)).forEach(function (pair) {
            finalPath.push([pair[0], pair[1]]);
        });
    });
    return finalPath;
}

// Utility function to get all point labels existing in the data
function getValidPointNames(allData) {
    var validNames = [];
    allData.forEach(function (data) {
        if (data.hasOwnProperty("paths")) {
            data.paths.forEach(function (segment) {
                validNames.push(segment.from);
                validNames.push(segment.to);
            });
        }
    });
    var uniqueNames = Array.from(new Set(validNames));
    uniqueNames.sort(); // in place
    return uniqueNames;
}


/////////////// MAIN CLASS DEFINITION /////////////////
function BandPlot(divID) {
    this.divID = divID;
    this.allData = [];
    this.allSeries = [];
    this.allColorInfo = [];
    // Keep track of the current path to avoid too many refreshes
    this.currentPath = [];

    if (typeof (this.myChart) != "undefined") {
        this.myChart.destroy();
    }
}

BandPlot.prototype.addBandStructure = function (bandsData, colorInfo) {
    // User needs to call updateBandPlot after this call

    // bandData format:
    //   data.Y_label = "The Y label"
    //   data.path = [["G", "M"], ["M", "K"], ["K", "G"]], it's the default path
    //   data.paths = list of segment objects as described here below.
    //     each segment is an object: {from: "G", to: "M", values, x}
    //     - x has length N
    //     - x HAS an offset! You need to remove it if needed
    //     - values has length numbands * x

    // colorInfo format:
    // It is array of 3 colors: [Single, Up, Down]
    //  - Single' color will be used when there is no up/down bands
    //  - 'Up' color for spin up bands
    //  - 'Down' color of spin down bands

    var defaultColors = ['#555555', '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];

    if (typeof (colorInfo) === 'undefined') {
        var nextIndex = this.allColorInfo.length;
        var newColor = tinycolor(defaultColors[nextIndex % defaultColors.length]);
        colorInfo = [newColor.toHexString(), newColor.darken(20).toHexString(), newColor.brighten(20).toHexString()];
    }

    this.allColorInfo.push(colorInfo);
    this.allData.push(bandsData);
};

BandPlot.prototype.initChart = function (ticksData) {
    var bandPlotObject = this;
    var chartOptions = {
        type: 'scatter',
        data: {
            datasets: this.allSeries
        },
        options: {
            legend: {
                display: false
            },
            animation: {
                duration: 0
            },
            responsive: true,
            maintainAspectRatio: false,
            tooltips: {
                displayColors: false,
                backgroundColor: "#fcfcfc",
                borderColor: "#1565c0",
                borderWidth: 1,
                bodyFontColor: "black",
                bodySpacing: 6,
                cornerRadius: 0,
                callbacks: {
                    label: function (tooltipItem, data) {
                        console.log("::", tooltipItem);
                        var label = "y= " + tooltipItem.yLabel.toFixed(2);
                        return [label, "Drag to zoom"];
                    }
                }
            },
            scales: {
                xAxes: [{
                    display: true,
                    ticks: {
                        // change the label of the ticks
                        callback: function(value, index, values) {
                            return this.options.customTicks[index].label;
                        }
                    },
                    // Important to set this, will give access to the
                    // ticks in the various callbacks.
                    customTicks: ticksData,
                    afterBuildTicks: function(axis, ticks) {
                        // Must return 'filtered' ticks, i.e. a list of
                        // *positions* of the ticks only. 
                        // Here I instead just discart the old ticks
                        // and create new ones. The label
                        // will be changed in the ticks.callback call.
                        return axis.options.customTicks.map(
                            function(tickInfo) {return tickInfo.value;}
                        );
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true
                    },
                    gridLines: {
                        display : false
                    }
                }]
            },
            zoom: {
                enabled: true,
                mode: "y",
                drag: true
            }
        }
    };

    var ctx = document.getElementById(this.divID).getContext('2d');
    bandPlotObject.myChart = new Chart(ctx, chartOptions);

};

BandPlot.prototype.setYLimit = function(ymin, ymax) {
    this.myChart.options.scales.yAxes[0].ticks.min = ymin;
    this.myChart.options.scales.yAxes[0].ticks.max = ymax;

    this.myChart.update();
};

BandPlot.prototype.getDefaultPath = function () {
    if (this.allData.length > 0) {
        currentPathSpecification = this.allData[0].path;
        return currentPathSpecification; // use the default path from the first band structure
    } else {
        return [];
    }
};

BandPlot.prototype.updateBandPlot = function (bandPath, forceRedraw) {

    // used later to reference the object inside subfunctions
    var bandPlotObject = this;

    if (forceRedraw === undefined)
        forceRedraw = false;

    var emptyOffset = 0.1; // used when a segment is missing

    // Decide whether to use the default path or the one specified as parameter
    if (typeof (bandPath) === 'undefined') {
        currentPathSpecification = bandPlotObject.getDefaultPath();
    } else {
        currentPathSpecification = bandPath;
    }

    // Check if the path actually changed
    var hasChanged = false;
    if (bandPlotObject.currentPath.length != currentPathSpecification.length) {
        hasChanged = true;
    } else {
        zip(bandPlotObject.currentPath, currentPathSpecification).forEach(function (segmentSpec) {
            // Compare starting points of each segment
            if (segmentSpec[0][0] != segmentSpec[1][0]) {
                hasChanged = true;
            }
            // Compare ending points of each segment
            if (segmentSpec[0][1] != segmentSpec[1][1]) {
                hasChanged = true;
            }
        });
    }
    if ((!hasChanged) && (!forceRedraw)) {
        // do nothing if the path is the same
        return;
    }

    // Store the path in the internal cache
    bandPlotObject.currentPath = currentPathSpecification;

    // Function that picks a given segment among the full list
    // given the two extremes. Return the path subobject and a
    // boolean 'reverse' to say if we have to invert the path
    var pickSegment = function (segmentEdges, paths) {
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if ((path.from == segmentEdges[0]) && (path.to == segmentEdges[1])) {
                return {'segment': path, 'reverse': false};
            } else if ((path.from == segmentEdges[1]) && (path.to == segmentEdges[0])) {
                return {'segment': path, 'reverse': true};
            }
        }
        return null;
    };

    // Clean the plot removing the old bands
    // for (var i = bandPlotObject.myChart.series.length - 1; i>=0 ; i--) {
    //     bandPlotObject.myChart.series[i].remove(redraw=false);
    // }

    // Variable to keep track of the current position along x
    var currentXOffset = 0.0;

    // Array that will contain [position, label] for each high-symmetry point encountered
    highSymmetryTicks = [];

    // Clean up old series
    bandPlotObject.allSeries = [];

    // Plot each of the segments
    currentPathSpecification.forEach(function (segmentEdges, segment_idx) {
        // Add a new high-symmetry point, if needed
        if (highSymmetryTicks.length === 0) {
            // First segment, add always
            highSymmetryTicks.push([currentXOffset, segmentEdges[0]]);
        } else {
            // Add only if different than the previous point (than, join the string
            // with a pipe)
            if (highSymmetryTicks[highSymmetryTicks.length - 1][1] != segmentEdges[0]) {
                highSymmetryTicks[highSymmetryTicks.length - 1][1] += "|" + segmentEdges[0];
            }
        }

        var segmentFoundOnce = false;
        var thisSegmentLength = null;
        var i;
        // Check which segment we need to plot

        bandPlotObject.allData.forEach(function (bandsData, bandsIdx) {

            var segmentInfo = pickSegment(segmentEdges, bandsData.paths);
            if (segmentInfo) {

                // The segment was found, plot it
                segmentFoundOnce = true;

                // get the x array once, it's the same for all
                // make sure it starts from zero, and possibly reverse it if needed
                // (still will be from zero to a maximum value)
                var xArray = [];
                var xLength = segmentInfo.segment.x.length;
                if (segmentInfo.reverse) {
                    for (i = segmentInfo.segment.x.length - 1; i >= 0; i--) {
                        xArray.push(segmentInfo.segment.x[xLength - 1] - segmentInfo.segment.x[i]);
                    }
                } else {
                    for (i = 0; i < xLength; i++) {
                        xArray.push(segmentInfo.segment.x[i] - segmentInfo.segment.x[0]);
                    }
                }

                // Should I use two colors? (By default, no). This info is returned
                // (in new versions of AiiDA) for each segment
                twoBandTypes = segmentInfo.segment.two_band_types || false;
                numBands = segmentInfo.segment.values.length;

                if (thisSegmentLength === null) {
                    // I set the length from the first segment I find
                    thisSegmentLength = xArray[xArray.length - 1];
                }

                // I want all bands in this segment to have the same length;
                // For the first band scalingFactor is ALWAYS 1, for the rest might
                // be different and will be used to rescale the x axis.
                var scalingFactor = 1.0;
                if (xArray[xArray.length - 1] > 0) {
                    scalingFactor = thisSegmentLength / xArray[xArray.length - 1];
                    for (i = 0; i < xArray.length; i++) {
                        xArray[i] *= scalingFactor;
                    }
                }

                // If the path has no length (first point and last point coincide)
                // then I do not print. I check the x value at the last point
                // of xArray (xArray, in the lines above, is defined so that
                // xArray[0] = 0 and xArray[xArray.length-1] is the total
                // length of the array
                if (thisSegmentLength > 0) {

                    // Plot each band of the segment
                    segmentInfo.segment.values.forEach(function (band, band_idx) {
                        var curve = [];
                        var theBand;

                        if (segmentInfo.reverse) {
                            // need to use slice because reverse works in place and
                            // would modify the original array
                            theBand = band.slice().reverse();
                        } else {
                            theBand = band;
                        }

                        zip(xArray, theBand).forEach(function (xy_point) {
                            curve.push(
                                {x: xy_point[0] + currentXOffset, y: xy_point[1]});
                        });

                        colorInfo = bandPlotObject.allColorInfo[bandsIdx];
                        if (twoBandTypes) {
                            if (band_idx * 2 < numBands) {
                                // Color for the first half of bands
                                lineColor = colorInfo[1]; // Up color
                            } else {
                                // Color for the second half of bands
                                lineColor = colorInfo[2]; // Down color
                            }
                        } else {
                            lineColor = colorInfo[0]; // Single color when there is no up/down bands
                        }

                        var series = {
                            label: segmentEdges[0] + "-" + segmentEdges[1] + "." + band_idx,
                            //backgroundColor: lineColor,
                            borderColor: lineColor,
                            borderWidth: 2,
                            data: curve,
                            fill: false,
                            showLine: true,
                            pointRadius: 0
                        };

                        bandPlotObject.allSeries.push(series);
                    });
                } else {
                    // If we are here, there is a segment, but its path has zero
                    // length. I skip and I will add the empty Offset only once at the end
                }
            } else {
                // segment is null, no segment was found for this specific bandaData - don't do anything
            }

        });

        // Once I processed *all* band series, I apply a shift to the currentXOffset
        if (!segmentFoundOnce) {
            currentXOffset += emptyOffset;
        } else {
            if (thisSegmentLength > 0) {
                currentXOffset += thisSegmentLength;
            } else {
                currentXOffset += emptyOffset;
            }
        }

        highSymmetryTicks.push([currentXOffset, segmentEdges[1]]);

    });

    // Change labels with correct Greek fonts
    var highSymmetryUpdatedTicks = bandPlotObject.updateTicks(highSymmetryTicks);

    // map ticks into a list of dictionaries, for ease of use later
    ticksData = highSymmetryUpdatedTicks.map(function(data, idx) {
        return {value: data[0], label: data[1]};
    });

    if (typeof(bandPlotObject.myChart) == 'undefined') {
        bandPlotObject.initChart(ticksData);
    }
    else {
        // Just update the plot and ticks, do not recreate the whole plot
        bandPlotObject.myChart.options.scales.xAxes[0].customTicks = ticksData;
        bandPlotObject.myChart.data.datasets = bandPlotObject.allSeries;
    }

    bandPlotObject.myChart.options.scales.xAxes[0].ticks.min = 0;
    bandPlotObject.myChart.options.scales.xAxes[0].ticks.max = currentXOffset;

    Y_label = bandPlotObject.allData[0].Y_label;
    if (typeof(Y_label) === 'undefined') {
        Y_label = 'Electronic bands (eV)';
    }
    bandPlotObject.myChart.options.scales.yAxes[0].scaleLabel.labelString = Y_label;

    bandPlotObject.myChart.update();
};

// Update both ticks and vertical lines
// ticks should be in the format [xpos, label]
BandPlot.prototype.updateTicks = function (ticks) {
    // I save the 'this' instance for later reference

    var bandPlotObject = this;
    var i;

    //////////////////// Utility functions ///////////////////
    var labelFormatterBuilder = function (allData, ticks) {
        // Returns a function that is compatible with a
        // labelFormatter of highcharts.
        // In particular matches the x value with the label
        // also converts strings to prettified versions

        // pass both all the data (allData), used for the heuristics below
        // to determine the format for the prettifier, and the ticks array

        var label_info = {};
        for (i = 0; i < ticks.length; i++) {
            label_info[ticks[i][0]] = ticks[i][1];
        }

        // function to prettify strings (in HTML) with the new format defined in SeeK-path
        var prettifyLabelFormat = function (label) {
            label = label.replace(/GAMMA/gi, "Γ");
            label = label.replace(/DELTA/gi, "Δ");
            label = label.replace(/SIGMA/gi, "Σ");
            label = label.replace(/LAMBDA/gi, "Λ");
            label = label.replace(/\-/gi, "—"); // mdash
            label = label.replace(/_(.)/gi, function (match, p1, offset, string) {
                // no need to use break since I am returning
                // I am using Unicode subscript digits due to the lack
                // of support of ChartJS for HTML
                switch (p1) {
                    case "0":
                        return "₀";
                    case "1":
                        return "₁";
                    case "2":
                        return "₂";
                    case "3":
                        return "₃";
                    case "4":
                        return "₄";
                    case "5":
                        return "₅";
                    case "6":
                        return "₆";
                    case "7":
                        return "₇";
                    case "8":
                        return "₈";
                    case "9":
                        return "₉";
                }
                // HTML not supported by ChartJS
                // return "<sub>" + p1 + "</sub>";
                // As a fallback I just print the number
                return p1;
            });
            return label;
        };
        // function to prettify strings (in HTML) with the old legacy format defined in AiiDA
        var prettifyLabelLegacyFormat = function (label) {
            // Replace G with Gamma
            if (label == 'G') {
                label = "Γ";
            }
            label = label.replace(/\-/gi, "—"); // mdash
            // Replace digits with their lower-case version
            label = label.replace(/(\d)/gi, function (match, p1, offset, string) {
                switch (p1) {
                    case "0":
                        return "₀";
                    case "1":
                        return "₁";
                    case "2":
                        return "₂";
                    case "3":
                        return "₃";
                    case "4":
                        return "₄";
                    case "5":
                        return "₅";
                    case "6":
                        return "₆";
                    case "7":
                        return "₇";
                    case "8":
                        return "₈";
                    case "9":
                        return "₉";
                }
                // HTML not supported by ChartJS
                // return "<sub>" + p1 + "</sub>";
                // As a fallback I just print the number
                return p1;
            });
            return label;
        };

        // Some heuristics to decide the prettify format
        // If there is "GAMMA", it is the new format
        // If there is NOT "GAMMA" and there is "G", it's the legacy format
        // If there is not even "G", then to be safe I use the seekpath format
        // that for instance does not make numbers subscripts by default
        var validNames = getValidPointNames([allData]);
        var legacyFormat = false; // some default, should never be used anyway
        if (validNames.findIndex(function (label) {
            return label == "GAMMA";
        }) != -1) {
            // There is 'GAMMA': it is for sure the new format
            legacyFormat = false;
        } else {
            // GAMMA is not there
            if (validNames.findIndex(function (label) {
                return label == "G";
            }) != -1) {
                // there is G: it's the legacy format
                legacyFormat = true;
            } else {
                // There is neither 'GAMMA' nor G: no idea, I assume the new format
                legacyFormat = false;
            }
        }

        var prettifyLabel;
        if (legacyFormat) {
            prettifyLabel = prettifyLabelLegacyFormat;
        } else {
            prettifyLabel = prettifyLabelFormat;
        }

        // return the prettifier function
        return function (label) {
            if (typeof (label) === 'undefined') {
                return label;
            }
            newLabel = prettifyLabel(label);
            return newLabel;
        };
    };
    ////////////////// END OF UTILITY FUNCTIONS ///////////////////

    var labelFormatter = labelFormatterBuilder(bandPlotObject.allData, ticks);
    return ticks.map(function(tick) {
        return [tick[0], labelFormatter(tick[1])];
    });
};