
import {v4 as uuid } from 'uuid';

import Circle from 'ol/geom/Circle.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from 'ol/style.js';
import XYZ from 'ol/source/XYZ';
import * as proj from 'ol/proj';
import * as extent from 'ol/extent.js';
import * as olPixel from 'ol/pixel';
import { toContext } from 'ol/render.js';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import TileGrid from 'ol/tilegrid/TileGrid';
import { createXYZ } from 'ol/tilegrid';
import { toStringHDMS } from 'ol/coordinate.js';
import * as md5 from 'md5';
import * as Color from 'color';
import YAML from 'yaml'

import 'ol/ol.css';

document.addEventListener("DOMContentLoaded", function() {
    
    document.querySelectorAll(".waypoints_map_show").forEach(function(element) {
        $(element).click(function () {
            $($(element).attr("data-target")).show();
        });
    });
    
    document.querySelectorAll(".waypoints_map_hide").forEach(function(element) {
        $(element).click(function () {
            $($(element).attr("data-target")).hide();
        });
    });
    
    document.querySelectorAll(".waypoints_map").forEach(function(mapElement) {
        var $map = $(mapElement);
        
        var id = $map.attr('id');
        if (typeof id == 'undefined') {
            id = 'waypoints_map_' + uuid();
            $map.attr('id', id);
        }
        
        var bounds = [null, null, null, null]; // [minX, minY, maxX, maxY]
        var minMaxCoordinate = function (coordinate) {
            if (bounds[0] == null || bounds[0] > coordinate[0]) {
                bounds[0] = coordinate[0];
            }
            if (bounds[1] == null || bounds[1] > coordinate[1]) {
                bounds[1] = coordinate[1];
            }
            if (bounds[2] == null || bounds[2] < coordinate[0]) {
                bounds[2] = coordinate[0];
            }
            if (bounds[3] == null || bounds[3] < coordinate[1]) {
                bounds[3] = coordinate[1];
            }
        }
        
        var allFlightIds = [];
        var waypointsJsonToGeoFeatures = function (waypointJson) {
            var features = [];
            var previousCoordinates = null;
            
            for (var waypoint of waypointJson) {
                
                if (allFlightIds.indexOf(waypoint.flight_id) < 0) {
                    allFlightIds.push(waypoint.flight_id);
                }
                
                var coordinates = proj.fromLonLat([
                    parseFloat(waypoint.longitude),
                    parseFloat(waypoint.latitude)
                ]);
                
                minMaxCoordinate(coordinates);
                
                features.push({
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': coordinates,
                    },
                    'properties': {
                        'type': 'waypoint',
                        'id': waypoint.id,
                        'number': waypoint.number,
                        'name': waypoint.name,
                        'altitude': waypoint.elevation,
                        'tot': waypoint.tot,
                        'flight_id': waypoint.flight_id
                    },
                });
                
                if (previousCoordinates != null) {
                    features.push({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': [
                                previousCoordinates,
                                coordinates
                            ],
                        },
                        'properties': {
                            'type': 'waypoint-edge',
                            'flight_id': waypoint.flight_id
                        },
                    });
                }
                
                previousCoordinates = coordinates;
            }
            
            var geoJson = {
                'type': 'FeatureCollection',
                'features': features,
                'crs': {
                    'type': 'name',
                    'properties': {
                        'name': 'EPSG:4326'
                    }
                }
            };

            return (new GeoJSON()).readFeatures(geoJson);
        };
        
        var coordinatesToLatLong = function (coordinate) {
            var ns = (coordinate[1] < 0) ? "S" : "N";
            var nsDegree = parseInt(Math.abs(coordinate[1]));
            var nsMinutes = parseFloat(Math.abs(coordinate[1]) - nsDegree) * 60;
            nsMinutes = nsMinutes.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
            
            var we = (coordinate[0] < 0) ? "W" : "E";
            var weDegree = parseInt(Math.abs(coordinate[0]));
            var weMinutes = parseFloat(Math.abs(coordinate[0]) - weDegree) * 60;
            weMinutes = weMinutes.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
            
            // Produces a coord like: N36 14.680 W115 01.500
            return `${ns}${nsDegree} ${nsMinutes} ${we}${weDegree} ${weMinutes}`;
        };
        
        var updateMap = function () {
            $.ajax({
                url: $map.attr('data-source-url'),
                success: function (xhr) {
                    if (typeof xhr.responseJSON != "undefined") {
                        var responseJson = xhr.responseJSON;
                    } else {
                        var responseJson = xhr;
                    }

                    allFlightIds = [];
                    bounds = [null, null, null, null]; // [minX, minY, maxX, maxY]

                    var sourceType = $map.attr('data-source-type');
                    if (sourceType == 'flight') {
                        waypointsVectorLayer.setSource(new VectorSource({
                            features: waypointsJsonToGeoFeatures(responseJson)
                        }));
                        
                    } else if (sourceType == 'day') {
                        var allFeatures = [];
                        
                        for (var waypointJson of responseJson) {
                            allFeatures = allFeatures.concat(waypointsJsonToGeoFeatures(waypointJson));
                        }
                        
                        waypointsVectorLayer.setSource(new VectorSource({
                            features: allFeatures
                        }));
                        
                    } else {
                        throw new Error("Unknown or unspecified waypoint-map-source-type!");
                    }
                    
                    var $flightNameLegend = $(".flight_name_legend", $map);
                    
                    if ($flightNameLegend.length > 0) {
                        $flightNameLegend.empty();
                        
                        for (var flightId of allFlightIds) {
                            var flightColor = randomColorByString(flightId);
                            var flightName = $("a[href='/flights/" + flightId + "']").text();
                            
                            var $flightName = $('<div class="row"><span>' + flightName + "</span></div>");
                            $flightName.css("color", flightColor.hex());
                            $flightName.css("font-weight", "bold");
                            $flightName.css("paint-order", "stroke fill");
                            $flightName.css("-webkit-text-stroke", "2px " + strokeColorFor(flightColor));
                            
                            $flightNameLegend.append($flightName);
                        }
                    }
            
                    var width  = bounds[2] - bounds[0];
                    var height = bounds[3] - bounds[1];
                    
                    view.setCenter([
                        bounds[0] + (width / 2),
                        bounds[1] + (height / 2),
                    ]);
                    view.setZoom(8);
                }
            });
        };
        
        var randomColorByString = function(input) {
            return Color("#" + md5(input).substring(0, 6));
        };  
        var strokeColorFor = function(color) {
            if (color.isLight()) {
                return 'black';
            } else {
                return 'white';
            }
        };
        
        updateMap();

        $(document).on('click', '[type=submit]', function () {
            window.setTimeout(updateMap, 1000); // looks like there is no onSuccess event for normal forms
        });
      
        $.ajax({
            url: '/static-overlay.yaml',
            success: function (xhr) {
                
                // if (typeof xhr.responseJSON != "undefined") {
                //     var staticOverlayData = xhr.responseJSON;
                // } else {
                //     var staticOverlayData = xhr;
                // }
                
                var staticOverlayData = YAML.parse(xhr);
                
                var features = [];
                var circles = [];
                
                for (var airspace of staticOverlayData['airspaces']) {
                    
                    var lonSum = 0.0;
                    var latSum = 0.0;
                    
                    var airspaceCoordinates = [];
                    for (var airspaceVertice of airspace['polygon']) {
                        airspaceCoordinates.push(proj.fromLonLat([
                            airspaceVertice[1],
                            airspaceVertice[0]
                        ]));
                        
                        lonSum += airspaceVertice[1];
                        latSum += airspaceVertice[0];
                    }
                    
                    features.push({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Polygon',
                            'coordinates': [airspaceCoordinates],
                        },
                        'properties': {
                            'type': 'airspace',
                            'name': airspace.name,
                            'color': airspace.fillColor,
                            'opacity': airspace.fillOpacity,
                        },
                    });
                    
                    features.push({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': proj.fromLonLat([
                                lonSum / airspace['polygon'].length,
                                latSum / airspace['polygon'].length,
                            ]),
                        },
                        'properties': {
                            'type': 'airspace-center',
                            'name': airspace.name,
                            'color': airspace.color,
                        },
                    });
                }
                
                for (var waypoint of staticOverlayData['staticwaypoints']) {
                    features.push({
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': proj.fromLonLat([
                                waypoint.coordinates[1],
                                waypoint.coordinates[0]
                            ]),
                        },
                        'properties': {
                            'type': 'static-waypoint',
                            'name': waypoint.name,
                            'color': waypoint.color,
                        },
                    });
                }
                
                for (var threat of staticOverlayData['threats']) {
                    var threatFeature = new Feature({
                        geometry: new Circle(
                            proj.fromLonLat([
                                threat.coordinates[1],
                                threat.coordinates[0]
                            ]), 
                            threat.radius / proj.METERS_PER_UNIT.m
                        ),
                    });
                    
                    var color = new Color(threat.fillColor);
                    
                    threatFeature.setStyle(new Style({
                        fill: new Fill({color: color.fade(threat.fillOpacity)}),
                        stroke: new Stroke({
                            color: threat.color,
                            width: 1,
                        }),
                        text: new Text({
                            text: threat.name,
                            textBaseline: 'top',
                            offsetY: 12,
                            fill: new Fill({color: color.hex()}),
                            stroke: new Stroke({
                                color: strokeColorFor(color),
                                width: 3,
                            }),
                        }),
                    }));
                    
                    circles.push(threatFeature);
                }

                var vectorSource = new VectorSource({
                    features: (new GeoJSON()).readFeatures({
                        'type': 'FeatureCollection',
                        'features': features,
                        'crs': {
                            'type': 'name',
                            'properties': {
                                'name': 'EPSG:4326'
                            }
                        }
                    })
                });

                staticOverlayVectorLayer.setSource(vectorSource);
                
                for (var circle of circles) {
                    vectorSource.addFeature(circle);
                }
            }
        });
        
        const staticOverlayVectorLayer = new VectorLayer({
            style: function (feature, resolution) {
                var properties = feature.getProperties();
                
                if (properties.type == 'static-waypoint') {
                    
                    var color = new Color(properties.color);
                    
                    return new Style({
                        image: new CircleStyle({
                            radius: 7,
                            fill: new Fill({color: color.hex()}),
                            stroke: new Stroke({color: strokeColorFor(color), width: 3}),
                        }),
                        text: new Text({
                            text: properties.name,
                            textBaseline: 'top',
                            offsetY: 12,
                            fill: new Fill({color: color.hex()}),
                            stroke: new Stroke({
                                color: strokeColorFor(color),
                                width: 3,
                            }),
                        }),
                    });
                    
                } else if (properties.type == 'airspace') {
                    var color = new Color(properties.color);
                    
                    return new Style({
                        fill: new Fill({color: color.fade(properties.opacity)}),
                        stroke: new Stroke({
                            color: strokeColorFor(color),
                            width: 1,
                        }),
                    });
                    
                } else if (properties.type == 'airspace-center') {
                    var color = new Color(properties.color);
                    
                    return new Style({
                        text: new Text({
                            text: properties.name,
                            fill: new Fill({color: color.hex()}),
                            stroke: new Stroke({
                                color: strokeColorFor(color),
                                width: 3,
                            }),
                        }),
                    });
                }
            },
        });
      
        const waypointsVectorLayer = new VectorLayer({
            style: function (feature, resolution) {
                var properties = feature.getProperties();
                
                if (properties.type == 'waypoint') {
                    
                    var text = [
                        "#" + properties.number,
                        '16px monospace',
                        "\n",
                        "",
                        properties.name,
                        'bold 10px sans-serif'
                    ];
                    
                    if (properties.altitude != null) {
                        text.push("\n");
                        text.push("");
                        text.push(properties.altitude + "ft");
                        text.push("italic 8px monospace");
                    }
                    
                    var flightColor = randomColorByString(properties.flight_id);
                    
                    return new Style({
                        image: new CircleStyle({
                            radius: 7,
                            fill: new Fill({color: flightColor.hex()}),
                            stroke: new Stroke({color: strokeColorFor(flightColor), width: 3}),
                        }),
                        text: new Text({
                            text: text,
                            textBaseline: 'top',
                            offsetY: 12,
                            fill: new Fill({color: flightColor.hex()}),
                            stroke: new Stroke({
                                color: strokeColorFor(flightColor),
                                width: 3,
                            }),
                        }),
                    });
                
                } else if (properties.type == 'waypoint-edge') {
                    var flightColor = randomColorByString(properties.flight_id);
                    
                    return new Style({
                        fill: new Fill({color: flightColor.hex()}),
                        stroke: new Stroke({
                            color: flightColor.hex(),
                            width: 4,
                        }),
                    });
                    
                } else {
                    console.log(feature);
                }
            },
        });
        
        var view = new View({
            center: [0, 0],
            zoom: 2,
        });
        
        const projExtent = proj.get('EPSG:3857').getExtent();
        const startResolution = extent.getWidth(projExtent) / 256;
        const resolutions = new Array(22);
        const origins = new Array(22);
        for (let i = 0, ii = resolutions.length; i < ii; ++i) {
            resolutions[i] = startResolution / Math.pow(2, i);
            origins[i] = [0.0, 0.0];
        }
        
        // EPSG:3857
        // EPSG:4326
        var defaultTileGrid = createXYZ({extent: proj.get('EPSG:3857').getExtent()});
        
        var map = new Map({
            layers: [
                new TileLayer({
                    source: new XYZ({
                        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    })
                }),
                new TileLayer({
                    source: new XYZ({
                        url: 'https://virtual-jabog32.de/custom-map/{z}/{x}/{-y}.png',
                    }),
                    extent: proj.transformExtent(
                        [-119.54401291957859, 35.34068259788386, -110.69943216228121, 40.12071687216515],
                        'EPSG:4326',
                        'EPSG:3857'
                    )
                }),
                // new TileLayer({
                //     source: new XYZ({
                //         // https://t.skyvector.com/V7pMh4xRihflnr61/301/2410/6/71/149.jpg
                //         url: 'https://t.skyvector.com/V7pMh4xRihflnr61/301/2410/{z}/{x}/{y}.jpg',
                //         
                //         // las vegas: https://tile.openstreetmap.org/8/46/100.png
                //         
                //         // las vegas: https://t.skyvector.com/V7pMh4xRihflnr61/301/2410/4/138/301.jpg
                //         tileGrid: new TileGrid({
                //             
                //             origin: defaultTileGrid.getOrigin(0),
                //             resolutions: defaultTileGrid.getResolutions()
                //             
                //             
                //             // resolutions: resolutions,
                //             // origins: origins
                //         }),
                //     })
                // }),
                staticOverlayVectorLayer,
                waypointsVectorLayer,
            ],
            target: id,
            view: view,
        });
        
        var $target = null;
        
        map.on("click", function(event) {
            
            var coordinateClicked = proj.transform(
                map.getCoordinateFromPixel(event.pixel),
                "EPSG:3857",
                "EPSG:4326"
            );
                
            var waypoint = null;
            map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
                var properties = feature.getProperties();
                
                if (properties.type == 'waypoint') {
                    waypoint = properties;
                }
            });
            
            var formId = uuid();
            
            if ($target != null) {
                $target.popover('hide');
                $target.remove();
            }
            
            $target = $("<div />");
            $target.attr("id", uuid());
            $target.attr("style", "position: absolute; left: " + event.pixel[0] + "px; top: " + event.pixel[1] + "px")
            
            $map.append($target);
            
            $target.popover({
                trigger: 'manual',
                container: 'body',
                html: true,
                sanitize: false,
                placement: 'auto',
                content: function () {
                    var formId = uuid();
                    var latLong = coordinatesToLatLong(coordinateClicked);
                    var hdms = toStringHDMS(coordinateClicked);
                    
                    var templateHtml = $("> .waypoints_map_menu_template", $map).html();
                    
                    templateHtml = templateHtml.replaceAll("FORM_UUID", formId);
                    templateHtml = templateHtml.replaceAll("FORM_INPUT_LATLONG", latLong);
                    templateHtml = templateHtml.replaceAll("FORM_INPUT_HDMS", hdms);
                    
                    var $menu = $(templateHtml);
                    
                    if (waypoint == null) {
                        $(".btn-mod-wp", $menu).remove();
                        $(".btn-del-wp", $menu).remove();
                        $(".btn-add-wp-before", $menu).remove();
                        
                    } else {
                        $(".btn-add-wp-here", $menu).remove();
                    }
                    
                    var closeMenu = function () {
                        $target.popover('hide');
                        $target.remove();
                    };
                    
                    $(document).on('click', '#' + formId + '-mod-wp-btn', function () {
                        closeMenu();
                        $("button[data-id="+ waypoint.id +"]").click();
                    });

                    $(document).on('click', '#' + formId + '-del-wp-btn', function () {
                        closeMenu();
                        $("#waypoint_" + waypoint.id + " a[data-method=delete]")[0].click();
                    });

                    $(document).on('click', '#' + formId + '-add-wp-before-btn', function () {
                        closeMenu();
                        $("[data-insert="+ waypoint.id +"]").trigger("click");
                    });
                        
                    $(document).on('click', '#' + formId + '-add-wp-here-btn', function () {
                        closeMenu();
                        $("#add-waypoint button").trigger("click");
                        $("#waypoint_pos").val(latLong);
                    });
                        
                    $(document).on('click', '#' + formId + '-close-btn', closeMenu);
                    
                    return $menu.prop('outerHTML');
                }
            }).on('shown.bs.popover', function() {
                $('body .popover').css({ 'max-width': '800px' });
            });
            $target.popover('show');
        });
    });
});
