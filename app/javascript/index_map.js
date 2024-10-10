import L from 'leaflet';  // Import Leaflet
import 'leaflet.fullscreen';  // Import Fullscreen plugin

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("[data-flight-map]").forEach(function(mapElement) {
    // Parse flight data from the map element's data attribute
    const flightData = JSON.parse(mapElement.getAttribute("data-flight-map"));
    const { index, waypoints, callsign, tasks, airframes, pilots } = flightData;  // Destructure all needed data
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00"];

    // Initialize the map for each date
    var map = L.map(`map_${index}`);

    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    }).addTo(map);

    // Add fullscreen control using the correct class
    L.control.fullscreen().addTo(map);

// Add a legend for this map
var legend = L.control({ position: "bottomright" });
legend.onAdd = function(map) {
  var div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Flights</h4>";

  callsign.forEach((call, flightIndex) => {
    const task = tasks[flightIndex] || 'N/A';
    const airframe = airframes[flightIndex] || 'N/A';
    const pilotList = pilots[flightIndex] && pilots[flightIndex].length > 0 ? pilots[flightIndex].join(', ') : 'N/A';

    div.innerHTML += `
      <div style="margin-bottom: 10px;">
        <i style="background: ${colors[flightIndex % colors.length]};"></i> 
        ${call} 
        <button class="expand-button" data-flight-index="${flightIndex}">+</button>
        <div id="details_${flightIndex}" class="flight-details" style="display: none;">
          Task: ${task}<br>
          Airframe: ${airframe}<br>
          Pilots: ${pilotList}
        </div>
      </div>`;
  });

  return div;
};
legend.addTo(map);


    // Event listeners for expanding flight details
    document.addEventListener('click', function(e) {
      if (e.target && e.target.classList.contains('expand-button')) {
        const flightIndex = e.target.getAttribute('data-flight-index');
        const detailsElement = document.getElementById(`details_${flightIndex}`);
        if (detailsElement.style.display === 'none') {
          detailsElement.style.display = 'block';
        } else {
          detailsElement.style.display = 'none';
        }
      }
    });

    // Prepare for auto-centering
    let bounds = new L.LatLngBounds();

    // Add markers and a polyline for each flight
    waypoints.forEach((flightWaypoints, flightIndex) => {
      const latLngs = [];

      if (flightWaypoints && Array.isArray(flightWaypoints) && flightWaypoints.length > 0) {
        flightWaypoints.forEach(waypoint => {
          if (waypoint && waypoint.lat !== null && waypoint.lon !== null && !isNaN(waypoint.lat) && !isNaN(waypoint.lon)) {
            const latLng = [waypoint.lat, waypoint.lon];
            latLngs.push(latLng);
            bounds.extend(latLng); // Add each waypoint to bounds for auto-centering

            var flightMarker = L.circleMarker(latLng, {
              color: colors[flightIndex % colors.length],
              radius: 2  // Smaller radius for waypoints
            }).addTo(map);

            flightMarker.bindPopup(`Flight: ${callsign[flightIndex]}`);
          }
        });

        // Add polyline for the flight if there are enough valid waypoints
        if (latLngs.length > 1) {
          L.polyline(latLngs, { color: colors[flightIndex % colors.length] }).addTo(map);
        }
      }
    });

    // Fetch external JSON for static overlays
    fetch('/staticOverlay.json')
      .then(response => response.json())
      .then(data => {
        // Add airspace polygons with dashed borders
        data.airspaces.forEach(function (airspace) {
          var polygon = L.polygon(airspace.polygon, {
            color: airspace.color,
            fillColor: airspace.fillColor,
            fillOpacity: airspace.fillOpacity,
            dashArray: '5, 10'  // Dashed border for polygons
          }).addTo(map).bindPopup(airspace.name);

          // Ensure it goes to the back after it's added
          polygon.on('add', function() {
            polygon.bringToBack();
          });
        });

        // Add static waypoints
        data.staticwaypoints.forEach(function (staticwaypoint) {
          var waypoint = L.circleMarker(staticwaypoint.coordinates, {
            radius: staticwaypoint.radius,
            color: staticwaypoint.color
          }).addTo(map).bindPopup(staticwaypoint.name);

          // Ensure waypoint comes to the front after it's added
          waypoint.on('add', function() {
            waypoint.bringToFront();
          });
        });

        // Add threat circles
        data.threats.forEach(function (threat) {
          var threatCircle = L.circle(threat.coordinates, {
            radius: threat.radius,
            color: threat.color,
            fillColor: threat.fillColor,
            fillOpacity: threat.fillOpacity
          }).addTo(map).bindPopup(threat.name);

          // Ensure threat comes to the front after it's added
          threatCircle.on('add', function() {
            threatCircle.bringToFront();
          });
        });

        // Fit the map to the bounds of all waypoints and polygons
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        } else {
          map.setView([51.505, -0.09], 8);
        }
      })
      .catch(error => console.error('Error loading static overlays:', error));
  });
});
