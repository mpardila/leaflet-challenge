// Adding the tile layers
let grayMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

let geo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

// Define the URL
let url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
// Start a local web server to avoid a CORS issue
let tectonicPlates = "tectonicplates-master/GeoJSON/PB2002_boundaries.json" 

// To do:

// Get the tectonic plates with d3.
d3.json(tectonicPlates).then(function(plates){
    plates.features.forEach(feature => {
        // Check if the feature is a LineString
        if (feature.geometry.type === "LineString") {
            // Extract the coordinates
            let coordinates = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
    
            // Create a polyline using the coordinates
            let line = L.polyline(coordinates, { 
                color: '#dd1c77',
                weight: 2
            });
            line.addTo(tectonic);
        }
    });
});

// Define a function for color scale
function colorScale(depth) {
    if (depth <= 5)
        return '#90EE90'; // Light Green
    else if (depth > 5 && depth <= 20)
        return '#FFD700'; // Gold
    else if (depth > 20 && depth <= 50)
        return '#FFA500'; // Orange
    else if (depth > 50 && depth <= 100)
        return '#FF6B00'; // Dark Orange
    else
        return '#FF0000'; // Red
};

// Get the data with d3.
d3.json(url).then(function (response){
    console.log(response.features);

    // Loop through the data.
  for (let i = 0; i < response.features.length; i++){
    let location = response.features[i];
    // Get lat, lon and dep of each earthquake
    let lat = location.geometry.coordinates[1];
    let lon = location.geometry.coordinates[0];
    let dep = location.geometry.coordinates[2];
    let mag = location.properties.mag;

    let eqMarker = L.circle([lat, lon], {
        color: "gray",
        weight: 0.5,
        fillColor: colorScale(dep),
        fillOpacity: 0.75,
        radius: mag * 30000  // Adjust size based on magnitude
      });

    eqMarker.bindPopup(`<h1>${location.properties.type}</h1><h2>${location.properties.place}</h2> <hr> <h3>Magnitude: ${mag}</h3> <h3>Depth: ${dep}</h3>`);
    eqMarker.addTo(earthquakes); // Add the marker to the earthquakes layer group
  }
});

// Create a legend
let legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
    // Create a div with the class 'info legend'
    let div = L.DomUtil.create('div', 'info legend');

    // Set the background color and border style for the legend
    div.style.backgroundColor = 'white';
    div.style.border = '2px solid black';
    div.style.padding = '6px';
    div.style.borderRadius = '5px';

    // Define the depth intervals and corresponding colors
    let depthIntervals = [
        { range: [0, 5], color: colorScale(5) },
        { range: [6, 20], color: colorScale(20) },
        { range: [21, 50], color: colorScale(50) },
        { range: [51, 100], color: colorScale(100) },
        { range: [101, Infinity], color: colorScale(101) }
    ];

    // Loop through the depth intervals to create legend items
    depthIntervals.forEach(interval => {
        div.innerHTML += '<i style="background:' + interval.color + '; width: 20px; height: 20px; display: inline-block; margin-right: 5px;"></i> ' +
            interval.range[0] + (interval.range[1] ? '&ndash;' + interval.range[1] + '<br>' : '+');
    });

    return div;
};

// Create two separate layer groups: one for the earthquakes markers and another for the tectonic lines
let earthquakes = L.layerGroup();
let tectonic = L.layerGroup();

// Create a baseMaps object.
let baseMaps = {
  "Base Map": grayMap,
  "Geo Map": geo
};

// Create an overlay object.
let overlayMaps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonic
  };
  
// Define a map object.
let myMap = L.map("map", {
    center: [30, 0],
    zoom: 2.4,
    layers: [grayMap, earthquakes, tectonic]
});
  
// Add the legend to the map
legend.addTo(myMap);

// Pass our map layers to our layer control.
// Add the layer control to the map.
L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(myMap);