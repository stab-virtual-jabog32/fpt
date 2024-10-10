import L from 'leaflet';  // Import Leaflet
import 'leaflet.fullscreen';  // Import Fullscreen plugin

document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("[data-flight-map]").forEach(function(mapElement) {
    const flightData = JSON.parse(mapElement.getAttribute("data-flight-map"));
    const { index, waypoints, callsign } = flightData;
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
        div.innerHTML += `<i style="background: ${colors[flightIndex % colors.length]};"></i> ${call}<br>`;
      });
      return div;
    };
    legend.addTo(map);

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
          L.polygon(airspace.polygon, {
            color: airspace.color,             // Border color
            fillColor: airspace.fillColor,     // Fill color
            fillOpacity: airspace.fillOpacity, // Fill opacity
            dashArray: '5, 10'                 // Dashed border
          }).addTo(map).bindPopup(airspace.name);
        });


        // Add staticwaypoint markers
        data.staticwaypoints.forEach(function (staticwaypoint) {
          L.circleMarker(staticwaypoint.coordinates, {
            radius: staticwaypoint.radius,
            color: staticwaypoint.color
          }).addTo(map).bindPopup(staticwaypoint.name);
        });

        // Add threat circles
        data.threats.forEach(function (threat) {
          L.circle(threat.coordinates, {
            radius: threat.radius,
            color: threat.color,
            fillColor: threat.fillColor,
            fillOpacity: threat.fillOpacity
          }).addTo(map).bindPopup(threat.name);
        });

        // Fit the map to the bounds of all waypoints
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        } else {
          map.setView([51.505, -0.09], 8);
        }
      })
      .catch(error => console.error('Error loading static overlays:', error));
  });
});
