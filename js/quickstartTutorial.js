/* Example from Leaflet Quick Start Guide*/

// Create a Leaflet map centered on London with zoom level 13
var map = L.map('map').setView([51.505, -0.09], 13);

//add tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Add a marker at specified coordinates
var marker = L.marker([51.5, -0.09]).addTo(map);

// Add a styled circle with 500 meter radius
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,    radius: 500
}).addTo(map);

// Add a polygon defined by three coordinate vertices
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// Bind and immediately open popup on marker
marker.bindPopup(
    "<strong>Hello world!</strong><br />I am a popup."
).openPopup();

// Bind popup to circle (opens when clicked)
circle.bindPopup("I am a circle.");

// Bind popup to polygon (opens when clicked)
polygon.bindPopup("I am a polygon.");

// Create and immediately display a standalone popup
var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(map);

// Create reusable popup instance
var popup = L.popup();

// Define function to handle map click events
function onMapClick(e) {
    popup
        .setLatLng(e.latlng) // Set popup at clicked location
        .setContent("You clicked the map at " + 
            e.latlng.toString()) // Display clicked coordinates
        .openOn(map); // Open popup on map
}

// Attach click event listener to the map
map.on('click', onMapClick);