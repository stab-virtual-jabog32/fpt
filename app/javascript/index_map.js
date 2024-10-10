import L from 'leaflet';  // Import Leaflet
import 'leaflet.fullscreen';  // Import Fullscreen plugin

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-flight-map]").forEach(function (mapElement) {
    const flightData = JSON.parse(mapElement.getAttribute("data-flight-map"));
    const { index, waypoints, callsign, tasks, airframes, pilots } = flightData;
    const colors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff", "#00ffff", "#ffff00"];

    // Initialize the map
    var map = L.map(`map_${index}`).setView([51.505, -0.09], 8);

    // Add the tile layer
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | OpenTopoMap (CC-BY-SA)'
    }).addTo(map);

    // Add fullscreen control
    L.control.fullscreen().addTo(map);

    // Sidebar for adding primitives (only in fullscreen)
    const sidebar = L.control({ position: 'topleft' });
    sidebar.onAdd = function (map) {
      const div = L.DomUtil.create('div', 'sidebar legend');  // Use "legend" class for styling similar to legend
      div.style.display = 'none';  // Initially hidden
      div.innerHTML = `
        <h4>Primitives</h4>
        <button id="addMarker">Add Marker</button><br>
        <button id="addCircle">Add Circle</button><br>
        <button id="addRectangle">Add Rectangle</button>
      `;
      return div;
    };
    sidebar.addTo(map);

    map.on('enterFullscreen', () => {
      document.querySelector('.sidebar').style.display = 'block';
    });

    map.on('exitFullscreen', () => {
      document.querySelector('.sidebar').style.display = 'none';
    });

    // Get map center coordinates
    function getMapCenter() {
      return map.getCenter();  // Get the current center of the map
    }

    // Disable and enable map interactions (panning/zooming)
    function disableMapInteractions() {
      map.dragging.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }

    function enableMapInteractions() {
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    }

    // Add event listeners to buttons after the sidebar is added
    map.on('enterFullscreen', () => {
      // Add a movable marker to the center of the map
      document.getElementById("addMarker").addEventListener("click", () => {
        const center = getMapCenter();
        const marker = L.marker(center, { draggable: true }).addTo(map);
        marker.bindPopup('Customizable Marker').openPopup();
      });

      // Add a movable and resizable circle to the center of the map
      document.getElementById("addCircle").addEventListener("click", () => {
        const center = getMapCenter();
        const circle = L.circle(center, { color: 'red', radius: 500 }).addTo(map);
        circle.bindPopup('Customizable Circle').openPopup();

        // Dragging the circle
        circle.on('mousedown', function (e) {
          disableMapInteractions();
          map.on('mousemove', function (ev) {
            circle.setLatLng(ev.latlng);  // Move the circle with the mouse
          });
        });

        map.on('mouseup', function () {
          enableMapInteractions();
          map.off('mousemove');  // Stop dragging when the mouse is released
        });
      });

      // Add a movable and resizable rectangle to the center of the map
      document.getElementById("addRectangle").addEventListener("click", () => {
        const center = getMapCenter();
        const bounds = [
          [center.lat - 0.01, center.lng - 0.01],
          [center.lat + 0.01, center.lng + 0.01]
        ];

        const rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1 }).addTo(map);
        rectangle.bindPopup('Customizable Rectangle').openPopup();

        // Dragging the rectangle
        rectangle.on('mousedown', function (e) {
          disableMapInteractions();
          map.on('mousemove', function (ev) {
            const newBounds = [
              [ev.latlng.lat - 0.01, ev.latlng.lng - 0.01],
              [ev.latlng.lat + 0.01, ev.latlng.lng + 0.01]
            ];
            rectangle.setBounds(newBounds);  // Update the rectangle size and position
          });
        });

        map.on('mouseup', function () {
          enableMapInteractions();
          map.off('mousemove');  // Stop dragging when the mouse is released
        });

        // Adding resize handles for the rectangle
        const resizeHandles = [
          [bounds[0][0], bounds[0][1]],  // Top-left
          [bounds[1][0], bounds[1][1]]   // Bottom-right
        ];

        resizeHandles.forEach(handlePosition => {
          const resizeHandle = L.circleMarker(handlePosition, {
            radius: 6,
            color: 'blue',
            draggable: true
          }).addTo(map);

          resizeHandle.on('drag', function (ev) {
            const newBounds = [
              [ev.latlng.lat - 0.01, ev.latlng.lng - 0.01],
              [ev.latlng.lat + 0.01, ev.latlng.lng + 0.01]
            ];
            rectangle.setBounds(newBounds);  // Resize the rectangle
          });

          resizeHandle.on('mousedown', function () {
            disableMapInteractions();  // Disable map interactions when resizing
          });

          resizeHandle.on('mouseup', function () {
            enableMapInteractions();  // Re-enable map interactions after resizing
          });
        });
      });
    });

    // Add a legend for the map
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

    // Expand and collapse flight details in the legend
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
