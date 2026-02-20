// Create a map centered over the western United States at zoom level 5
var map = L.map('map').setView([40, -105], 5);

//add tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Define GeoJSON point features
var geojsonFeature = [{
    "type": "Feature", // GeoJSON feature object
    "properties": {
        "name": "Coors Field", // Feature name
        "amenity": "Baseball Stadium", // Type of amenity
        "popupContent": "This is where the Rockies play!", // Popup text
        "show_on_map": true // Boolean for filtering
    },
    "geometry": {
        "type": "Point", // Geometry type
        "coordinates": [-104.99404, 39.75621] // [longitude, latitude]
    }
}, {
    "type": "Feature",
    "properties": {
        "name": "Busch Field",
        "amenity": "Sports Stadium",
        "popupContent": "Not named after President Bush?",
        "show_on_map": false // Will be filtered out
    },
    "geometry": {
        "type": "Point",
        "coordinates": [-104.98404, 39.74621]
    }
}];

// Define GeoJSON LineString geometries
var myLines = [{
    "type": "LineString",
    "coordinates": [[-100, 40], [-105, 45], [-110, 55]] // Array of [lng, lat] pairs
}, {
    "type": "LineString",
    "coordinates": [[-105, 40], [-110, 45], [-115, 55]]
}];

// Define GeoJSON polygon features representing states
var states = [{
    "type": "Feature",
    "properties": {"party": "Republican"}, // Attribute for styling
    "geometry": {
        "type": "Polygon", // Polygon geometry
        "coordinates": [[
            [-104.05, 48.99],
            [-97.22,  48.98],
            [-96.58,  45.94],
            [-104.03, 45.94],
            [-104.05, 48.99]
        ]]
    }
}, {
    "type": "Feature",
    "properties": {"party": "Democrat"},
    "geometry": {
        "type": "Polygon",
        "coordinates": [[
            [-109.05, 41.00],
            [-102.06, 40.99],
            [-102.03, 36.99],
            [-109.04, 36.99],
            [-109.05, 41.00]
        ]]
    }
}];

// Define style for line features
var myStyle = {
    "color": "#ff7800",
    "weight": 5,
    "opacity": 0.65
};

// Define styling options for circle markers
var geojsonMarkerOptions = {
    radius: 8,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

// Function to bind popup if popupContent property exists
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
        layer.bindPopup(feature.properties.popupContent); // Attach popup
    }
}

// Add LineString features to map with predefined style
L.geoJSON(myLines, {
    style: myStyle
}).addTo(map);

// Add state polygons with conditional styling based on party attribute
L.geoJSON(states, {
    style: function(feature) {
        switch (feature.properties.party) {
            case 'Republican': return {color: "#ff0000"};
            case 'Democrat':   return {color: "#0000ff"};
        }
    }
}).addTo(map);

// Add point features with filtering, custom marker styling, and popups
L.geoJSON(geojsonFeature, {
    filter: function(feature) {
        return feature.properties.show_on_map; // Only display if true
    },
    pointToLayer: function (feature, latlng) {
        // Convert points to styled circle markers
        return L.circleMarker(latlng, geojsonMarkerOptions);
    },
    onEachFeature: onEachFeature // Attach popups
}).addTo(map);