/* Map of GeoJSON climate matrix data */

//declare map var in global scope
var map;

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


//function to retrieve data
function getData(){
    //load the data
    fetch("data/ClimateNormals.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            climateMetadata = json.metadata;

            //create marker options
            var geojsonMarkerOptions = {
                radius: 6,
                fillColor: "#2c7fb8",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };

            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                pointToLayer: function(feature, latlng){
                    return L.circleMarker(latlng, geojsonMarkerOptions);
                },
                onEachFeature: onEachFeature
            }).addTo(map);

        });
};

document.addEventListener('DOMContentLoaded', createMap);