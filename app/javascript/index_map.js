import L from 'leaflet';  // Import Leaflet
import 'leaflet.fullscreen';  // Import Fullscreen plugin
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-flight-map]").forEach(function (mapElement) {
    const flightData = JSON.parse(mapElement.getAttribute("data-flight-map"));
    const { index, waypoints, callsign, tasks, airframes, pilots } = flightData;
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
    legend.onAdd = function (map) {
      var div = L.DomUtil.create("div", "legend");
      div.innerHTML += "<h4>Flights</h4>";
      
      callsign.forEach((call, flightIndex) => {
        const task = tasks[flightIndex] || "N/A";  // Handle missing task
        const airframe = airframes[flightIndex] || "Unknown airframe";
        const pilotNames = pilots[flightIndex].length > 0 ? pilots[flightIndex].join(', ') : "No pilots assigned";

        div.innerHTML += `
          <div style="margin-bottom: 10px;">
            <i style="background: ${colors[flightIndex % colors.length]};"></i> ${call}
            <button class="expand-button" data-flight-index="${flightIndex}" data-map-index="${index}">+</button>
            <div id="details_${index}_${flightIndex}" class="flight-details" style="display: none;">
              Task: ${task}<br>
              Airframe: ${airframe}<br>
              Pilots: ${pilotNames}
            </div>
          </div>`;
      });

      return div;
    };
    legend.addTo(map);

    // Add event listener for expanding flight details
    mapElement.addEventListener("click", function (e) {
      if (e.target.classList.contains("expand-button")) {
        const flightIndex = e.target.getAttribute("data-flight-index");
        const mapIndex = e.target.getAttribute("data-map-index");
        const detailsElement = document.getElementById(`details_${mapIndex}_${flightIndex}`);
        
        if (detailsElement) {
          const isVisible = detailsElement.style.display === "block";
          detailsElement.style.display = isVisible ? "none" : "block";
          e.target.textContent = isVisible ? "+" : "-";  // Toggle button text
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
            const latLng = [parseFloat(waypoint.lat), parseFloat(waypoint.lon)];
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

    // Fit the map to the bounds of all waypoints
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    } else {
      map.setView([51.505, -0.09], 8); // Default location if no valid bounds
    }
  });
});
