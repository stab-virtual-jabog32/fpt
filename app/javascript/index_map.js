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
              radius: 10
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
      // If no valid bounds, fall back to a default location
      map.setView([51.505, -0.09], 8);
    }
  });
});
