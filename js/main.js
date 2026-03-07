/* Map of GeoJSON climate matrix data */

//declare map var in global scope
var map;

var minValue;

//store metadata globally
var climateMetadata;

var currVar = 3; // default: precip_in

var legendContainer;  // will hold the Leaflet control div
var geojsonData;      // store loaded GeoJSON globally

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [43.719, -87.9],
        zoom: 9
    });

    //add OSM base tilelayer
    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //call getData function
    getData();
};

function PopupContent() {}

//function to build HTML table from matrix
function buildClimateTable(feature){
    var months = climateMetadata.months;
    var variables = climateMetadata.variables;
    var climate = feature.properties.climate;
    var zip = feature.properties.zip;

    //start popup content
    var html = "<h3>ZIP Code: " + zip + "</h3>";
    html += "<table border='1' style='border-collapse:collapse; text-align:center;'>";
    
    //header row
    html += "<tr><th>Month</th>";
    variables.forEach(function(variable){
        html += "<th>" + variable + "</th>";
    });
    html += "</tr>";

    //data rows
    for (var i = 0; i < climate.length; i++){
        html += "<tr>";
        html += "<td><strong>" + months[i] + "</strong></td>";

        for (var j = 0; j < climate[i].length; j++){
            html += "<td>" + climate[i][j] + "</td>";
        }

        html += "</tr>";
    }

    html += "</table>";

    return html;
};

function createPopupContent(props, monthIndex) {
    var zipCode = props.zip;
    var climateVarName = getVariableDisplayName(currVar);
    var unit = getUnitForVariable(currVar);
    var currMonth = climateMetadata.months[monthIndex];
    var varMonthVal = props.climate[monthIndex][currVar];

    var popupContent = `
        <p><b>Zip:</b> ${zipCode}</p>
        <p><b>${climateVarName} in ${currMonth}:</b> ${varMonthVal} ${unit}</p>
    `;

    return popupContent;
}

//function to attach popup
function onEachFeature(feature, layer){
    var popupContent = buildClimateTable(feature);
    layer.bindPopup(popupContent, { maxWidth: 600 });
};

var dataStats = {};

function calcMinValue(data, variableIn){
    variable = climateMetadata.variables.indexOf(variableIn);

    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var zip of data.features){
        //loop through each year
        for(var month = 0; month < climateMetadata.months.length; month += 1){
              //get population for current year
              var value = zip.properties.climate[month][variable];
              //console.log(value);
              // feature.properties.climate[month][variable]
              //add value to array
              if (value !== null && value !== 0) { allValues.push(value) }
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues);
    dataStats.min = minValue;
    dataStats.mean = allValues.reduce(function(a, b){return a + b})/allValues.length;
    dataStats.max = Math.max(...allValues);

    //console.log(minValue);

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;

    //Flannery Appearance Compensation formula
    // 1.0083 correction factor used 
    // for large numbers related to populations
    var radius = Math.pow((attValue)/minValue, 0.5716) * minRadius

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    var variable = currVar;
    var month = 0; // Jan

    // get the attribute value
    var attValue = Number(feature.properties.climate[month][variable]);

    // create marker options
    var options = {
        fillColor: getCircleColor(currVar),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    // only set radius if value is valid
    if (attValue != null && attValue !== 0) {
        options.radius = calcPropRadius(attValue);
    } else {
        // hide invalid values
        options.radius = 0;
        options.opacity = 0;
        options.fillOpacity = 0;
    }

    // create circle marker
    var layer = L.circleMarker(latlng, options);

    // bind popup only if value is valid
    if (attValue != null && attValue !== 0) {
        var popupContent = createPopupContent(feature.properties, month);
        layer.bindPopup(popupContent);
    }

    return layer;
}

//Step 3: Add circle markers for point features to the map
//Example 2.1 line 34...Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function modifiedSequenceControls(attributes) {
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            // ... initialize other DOM elements
            container.insertAdjacentHTML('beforeend', '<input class="adapted-range-slider" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="adapted-step" id="reverse" title="Reverse"><img src="img/arrow_right.svg"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="adapted-step" id="forward" title="Forward"><img src="img/arrow_right.svg"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    map.addControl(new SequenceControl());    // add listeners after adding control}

    //set slider attributes
    document.querySelector(".adapted-range-slider").max = 11;
    document.querySelector(".adapted-range-slider").min = 0;
    document.querySelector(".adapted-range-slider").value = 0;
    document.querySelector(".adapted-range-slider").step = 1;

    //Step 5: click listener for buttons
    document.querySelectorAll('.adapted-step').forEach(function(step){
        step.addEventListener("click", function(){
            //sequence
            var index = document.querySelector('.adapted-range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };

            //Step 8: update slider
            document.querySelector('.adapted-range-slider').value = index;
            //console.log(index);

            updatePropSymbols(climateMetadata.months.indexOf(attributes[index]));
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.adapted-range-slider').addEventListener('input', function(){            
        //sequence
        //Step 6: get the new index value
        var index = this.value;
        //console.log(index)

        updatePropSymbols(climateMetadata.months.indexOf(attributes[index]));
    });
}

function createLegend() {
    var LegendControl = L.Control.extend({
        options: { position: 'bottomright' },
        onAdd: function() {
            legendContainer = L.DomUtil.create('div', 'legend-control-container');
            L.DomEvent.disableClickPropagation(legendContainer); // stop map interactions
            return legendContainer;
        }
    });

    map.addControl(new LegendControl());
}

function updateLegend(monthIndex){
    if (!legendContainer) return;

    var defaultVar = climateMetadata.variables[currVar];
    var defaultMonth = climateMetadata.months[monthIndex];

    var circleNames = ["max","mean","min"];
    var radii = circleNames.map(c => calcPropRadius(dataStats[c]));
    var maxRadius = Math.max(...radii);

    var paddingTop = 10;
    var paddingBottom = 10;
    var paddingSide = 10;
    var textOffset = 65;

    // SVG height: enough for largest circle + top and bottom padding
    var svgHeight = maxRadius + maxRadius + paddingTop + paddingBottom;
    var svgWidth = maxRadius + textOffset + paddingSide * 5;

    // Bottom tips stacked
    var bottomY = svgHeight - paddingBottom;

    var variableName = getVariableDisplayName(currVar);

    var html = `<p class="temporalLegend" style="padding-bottom:5px;">${variableName} in ${defaultMonth}</p>`;
    html += `<svg id="attribute-legend" width="${svgWidth}px" height="${svgHeight + 15}px">`;

    var unit = getUnitForVariable(currVar);

    // define minimum vertical spacing between text labels
    var minTextSpacing = 18;

    // keep track of last text y to enforce spacing
    var lastTextY = -30;

    circleNames.forEach(function(c){
        var radius = calcPropRadius(dataStats[c]);

        // circle center y so bottom aligns at bottomY
        var cy = bottomY - radius;
        var cx = maxRadius + paddingSide;

        var fillColor = getCircleColor(currVar);

        html += `<circle class="legend-circle" id="${c}" r="${radius}" cx="${cx}" cy="${cy}" fill="${fillColor}" fill-opacity="0.8" stroke="#000"/>`;

        // text y is circle center y, but ensure minimum spacing from previous text
        var textY = Math.max(cy, lastTextY + minTextSpacing);

        html += `<text x="${cx + textOffset - 15}" y="${textY - 15}" dominant-baseline="middle">${Math.round(dataStats[c]*100)/100} ${unit}</text>`;

        lastTextY = textY;
    });

    html += '</svg>';

    legendContainer.innerHTML = html;
}

//Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature) {
            var val = layer.feature.properties.climate[attribute][currVar];

            if (val != null && val !== 0) {
                // show circle with radius
                layer.setRadius(calcPropRadius(val));
                layer.setStyle({
                    opacity: 1,
                    fillOpacity: 0.8,
                    fillColor: getCircleColor(currVar)
                });
            } else {
                // hide circle without destroying it
                layer.setRadius(0);
                layer.setStyle({opacity: 0, fillOpacity: 0});
            }

            // update popup content only if value is valid
            if (val != null && val !== 0) {
                var popupContent = createPopupContent(layer.feature.properties, attribute);
                var popup = layer.getPopup();
                popup.setContent(popupContent).update();
            }
        }
    });

    // update temporal legend fully
    var legendElem = document.querySelector("p.temporalLegend");
    if (legendElem) {
        legendElem.textContent = getVariableDisplayName(currVar) + ' in ' + climateMetadata.months[attribute];
    }
}

function createVariableSelector() {
    // select all radio buttons for climate variable
    var radios = document.querySelectorAll('input[name="climateVar"]');

    radios.forEach(function(radio) {
        radio.addEventListener("change", function() {
            currVar = Number(this.value);

            // Recalculate global stats for the new variable
            minValue = calcMinValue(geojsonData, climateMetadata.variables[currVar]);

            // Get current slider month
            var monthIndex = Number(document.querySelector('.adapted-range-slider').value);

            // Update map symbols
            updatePropSymbols(monthIndex);

            // Update legend using global stats
            updateLegend(monthIndex);
        });
    });
}

function setDefaultVariableRadio() {
    var radios = document.querySelectorAll('input[name="climateVar"]');
    radios.forEach(function(radio) {
        if (Number(radio.value) === currVar) {
            radio.checked = true; // select the default
        }
    });
}

function createVariableControl() {
    var VariableControl = L.Control.extend({
        options: { position: 'topright' },
        onAdd: function(map) {
            var container = L.DomUtil.create('div', 'variable-control-container');
            L.DomEvent.disableClickPropagation(container); // prevents map panning

            container.innerHTML = `
                <form id="variable-form">
                    <label><input type="radio" name="climateVar" value="0" checked> Average Temp</label><br>
                    <label><input type="radio" name="climateVar" value="1"> Max Temp</label><br>
                    <label><input type="radio" name="climateVar" value="2"> Min Temp</label><br>
                    <label><input type="radio" name="climateVar" value="3"> Precipitation</label><br>
                    <label><input type="radio" name="climateVar" value="4"> Snowfall</label>
                </form>
            `;
            return container;
        }
    });

    map.addControl(new VariableControl());
}

function getVariableDisplayName(variableIndex) {
    switch(variableIndex) {
        case 0: return "Average Temperature";
        case 1: return "Maximum Temperature";
        case 2: return "Minimum Temperature";
        case 3: return "Precipitation";
        case 4: return "Snowfall";
        default: return "Unknown Variable";
    }
}

function getUnitForVariable(variableIndex) {
    switch (variableIndex) {
        case 0: // Average Temp
        case 1: // Max Temp
        case 2: // Min Temp
            return "°F";
        case 3: // Precipitation
        case 4: // Snowfall
            return "in";
        default:
            return "";
    }
}

function getCircleColor(variableIndex){
    var varName = climateMetadata.variables[variableIndex].toLowerCase();

    if(varName.includes("snow")) return "#ffffff";  // white for snow
    if(varName.includes("precip")) return "#1f78b4"; // blue for precipitation
    return "#F47821"; // default orange for temperature or others
}

//function to retrieve data
function getData(){
    fetch("data/DataEngineeredClimateNormals.geojson")
        .then(response => response.json())
        .then(json => {
            geojsonData = json;          
            climateMetadata = json.metadata;

            var attributes = climateMetadata.months;

            minValue = calcMinValue(json, climateMetadata.variables[currVar]);

            createVariableControl();
            createPropSymbols(json, attributes);
            modifiedSequenceControls(attributes);
            createLegend();             
            updateLegend(0);            
            createVariableSelector();
            setDefaultVariableRadio();
        });
};

document.addEventListener('DOMContentLoaded', createMap);