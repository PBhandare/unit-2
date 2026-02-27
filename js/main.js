/* Map of GeoJSON climate matrix data */

//declare map var in global scope
var map;

var minValue;

//store metadata globally
var climateMetadata;

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [43.4, -87.9],
        zoom: 9
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    //call getData function
    getData();
};


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


//function to attach popup
function onEachFeature(feature, layer){
    var popupContent = buildClimateTable(feature);
    layer.bindPopup(popupContent, { maxWidth: 600 });
};

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
              console.log(value);
              // feature.properties.climate[month][variable]
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    console.log(minValue);

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;

    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue, 0.5715) * minRadius

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng){
    //Determine which attribute to visualize with proportional symbols
    //var attribute = "Pop_2015";

    variable = climateMetadata.variables.indexOf("precip_in");
    //month = climateMetadata.months.indexOf(monthIn);
    month = 0; //Jan

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    //var attValue = Number(feature.properties[attribute]);
    console.log(feature.properties.climate[month][variable]);
    var attValue = Number(feature.properties.climate[month][variable]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    //var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";

    // var popupContent = buildClimateTable(feature);
    // layer.bindPopup(popupContent, { maxWidth: 600 });

    var popupContent = "<p><b>Zip:</b> " + feature.properties.zip + "</p><p><b>" + climateMetadata.variables[3] + " in " + climateMetadata.months[0] + ":</b> " + feature.properties.climate[month][variable] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

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
//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

        //set slider attributes
    document.querySelector(".range-slider").max = 11;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //below Example 3.6...add step buttons
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/arrow_right.svg'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/arrow_right.svg'>");

        //Below Example 3.6 in createSequenceControls()
    //Step 5: click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            //sequence
            var index = document.querySelector('.range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index; // change to len of months metadata
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            console.log(index);

            //Step 9: pass new attribute to update symbols
            updatePropSymbols(climateMetadata.months.indexOf(attributes[index]));
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        //sequence
        //Step 6: get the new index value
        var index = this.value;
        console.log(index)

        //Step 9: pass new attribute to update symbols
        updatePropSymbols(climateMetadata.months.indexOf(attributes[index]));
    });
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    map.eachLayer(function(layer){
        if (layer.feature && 
            layer.feature.properties.climate[attribute][climateMetadata.variables.indexOf("precip_in")]) {
            //update the layer style and popup
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props.climate[attribute][climateMetadata.variables.indexOf("precip_in")]);
            layer.setRadius(radius);

            //add city to popup content string
            // var popupContent = "<p><b>City:</b> " + props.City + "</p>";

            //add formatted attribute to panel content string
            //var year = attribute.split("_")[1];
            //popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";

            var popupContent = "<p><b>Zip:</b> " + props.zip + "</p><p><b>" + climateMetadata.variables[3] + " in " + climateMetadata.months[attribute] + ":</b> " + props.climate[attribute][climateMetadata.variables.indexOf("precip_in")] + "</p>";

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
};

//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data, category){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    // var properties = data.features[0].properties.climate[];

    //push each attribute name into attributes array
    // for (var attribute in properties){
        //only take attributes with population values
    //    if (attribute.indexOf("Pop") > -1){
    //        attributes.push(attribute);
    //    };
    // };

    //check result
    // console.log(attributes);

    return attributes;
};

//function to retrieve data
function getData(){
    //load the data
    fetch("data/ClimateNormals.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            climateMetadata = json.metadata;

            //var attributes = processData(json, "precip_in");
            var attributes = climateMetadata.months;

            //calculate minimum data value
            minValue = calcMinValue(json, "precip_in", "Jan");

            //call function to create proportional symbols
            createPropSymbols(json, attributes);

            createSequenceControls(attributes);
        })
};

document.addEventListener('DOMContentLoaded', createMap);