
import {v4 as uuid } from 'uuid';

import Circle from 'ol/geom/Circle.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from 'ol/style.js';
import XYZ from 'ol/source/XYZ';
// import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
// import Icon from 'ol/style/Icon.js';
import * as proj from 'ol/proj';
import * as extent from 'ol/extent.js';
import * as olPixel from 'ol/pixel';
import { toContext } from 'ol/render.js';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
// import Cluster from 'ol/source/Cluster';
import VectorSource from 'ol/source/Vector';
import TileGrid from 'ol/tilegrid/TileGrid';
import { createXYZ } from 'ol/tilegrid';
import { toStringHDMS } from 'ol/coordinate.js';

import 'ol/ol.css';



// POST http://localhost:3000/flights/2/waypoints/4
//     insert	""
//     name	"DREAM"
//     dme	"LAS+354/66+BLD+342/71"
//     pos	"N37+10.340+W114+59.530"
//     lat	"37.1723333333333"
//     lon	"-114.992166666667"
//     fmt	"dm"
//     prec	"3"
//     elev	"4000"
//     tot	""

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
      
        console.log(mapElement);
      
        var $map = $(mapElement);
        
        var id = $map.attr('id');
        
        if (typeof id == 'undefined') {
            id = 'waypoints_map_' + uuid();
            
            $map.attr('id', id);
        }
        
        var updateMap = function () {
            $.ajax({
              url: $map.attr('data-source-url'),
              success: function (xhr) {
                    if (typeof xhr.responseJSON != "undefined") {
                        var waypointJson = xhr.responseJSON;
                    } else {
                        var waypointJson = xhr;
                    }

                    console.log(waypointJson);
                    console.log(proj);
                    
                    var features = [];
                    var previousCoordinates = null;
                    
                    var minX = null;
                    var maxX = null;
                    var minY = null;
                    var maxY = null;
                        
                    var minMaxCoordinate = function (coordinate)
                    {
                        if (minX == null || minX > coordinate[0]) {
                            minX = coordinate[0];
                        }
                        if (maxX == null || maxX < coordinate[0]) {
                            maxX = coordinate[0];
                        }
                        if (minY == null || minY > coordinate[1]) {
                            minY = coordinate[1];
                        }
                        if (maxY == null || maxY < coordinate[1]) {
                            maxY = coordinate[1];
                        }
                    }
                    
                    for (var waypoint of waypointJson) {
                        console.log(waypoint);
                        
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
                    
                    var width = maxX - minX;
                    var height = maxY - minY;
                    
                    view.setCenter([
                        minX + (width / 2),
                        minY + (height / 2),
                    ]);
                    view.setZoom(10);
                    
                    console.log(geoJson);
                    
                    var vectorSource = new VectorSource({
                        features: new GeoJSON().readFeatures(geoJson),
                    });
                    
                    vectorLayer.setSource(vectorSource);
                }
            });
        };
        updateMap();
        
        console.log(updateMap);
        
        $(document).on('click', '[type=submit]', function () {
            window.setTimeout(updateMap, 1000); // looks like there is no onSuccess event for normal forms
        });
      
        const vectorLayer = new VectorLayer({
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
                    
                    return new Style({
                        image: new CircleStyle({
                            radius: 7,
                            fill: new Fill({color: 'black'}),
                            stroke: new Stroke({color: 'white', width: 3}),
                        }),
                        text: new Text({
                            text: text,
                            textBaseline: 'top',
                            offsetY: 12,
                            fill: new Fill({color: 'black'}),
                            stroke: new Stroke({
                                color: 'white',
                                width: 3,
                            }),
                        }),
                    });
                
                } else if (properties.type == 'waypoint-edge') {
                    return new Style({
                        fill: new Fill({color: 'black'}),
                        stroke: new Stroke({
                            color: 'black',
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
        
        console.log(proj);
        // console.log(proj.transformExtent(
        //                 [35.34068259788386, -110.69943216228121, 40.12071687216515, -119.54401291957859],
        //                 'EPSG:4326',
        //                 'EPSG:3857'
        //             ));
        
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
                vectorLayer,
            ],
            target: id,
            view: view,
        });
        
        console.log(map);
        
        var $target = null;
        
        map.on("click", function(event) {
            
            if ($target != null) {
                $target.popover('hide');
                $target.remove();
            }
            
            var clickId = uuid();
            
            var coordinateClicked = proj.transform(
                map.getCoordinateFromPixel(event.pixel),
                "EPSG:3857",
                "EPSG:4326"
            );
            
            console.log(event.pixel);
            console.log(coordinateClicked);
                
            var waypoint = null;
            
            map.forEachFeatureAtPixel(event.pixel, function (feature, layer) {
                
                console.log(feature);
                
                var properties = feature.getProperties();
                
                if (properties.type == 'waypoint') {
                    waypoint = properties;
                    
                    // console.log(properties);
                    // $("button[data-id="+ properties.id +"]").click();
                }
            });
            
            var formId = uuid();
            
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
                    
                    
                    var ns = (coordinateClicked[1] < 0) ? "S" : "N";
                    var nsDegree = parseInt(Math.abs(coordinateClicked[1]));
                    var nsMinutes = parseFloat(Math.abs(coordinateClicked[1]) - nsDegree) * 60;
                    nsMinutes = nsMinutes.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
                    
                    var we = (coordinateClicked[0] < 0) ? "W" : "E";
                    var weDegree = parseInt(Math.abs(coordinateClicked[0]));
                    var weMinutes = parseFloat(Math.abs(coordinateClicked[0]) - weDegree) * 60;
                    weMinutes = weMinutes.toLocaleString('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
                    
                    // Produces a coord like: N36 14.680 W115 01.500
                    var latLong = `${ns}${nsDegree} ${nsMinutes} ${we}${weDegree} ${weMinutes}`;
                    
                    var hdms = toStringHDMS(coordinateClicked);
                    
                    var formId = uuid();
                    
                    var templateHtml = $("> .waypoints_map_menu_template", $map).html();
                    
                    templateHtml = templateHtml.replaceAll("FORM_UUID", formId);
                    templateHtml = templateHtml.replaceAll("FORM_INPUT_LATLONG", latLong);
                    templateHtml = templateHtml.replaceAll("FORM_INPUT_HDMS", hdms);
                    
                    var $menu = $(templateHtml);
                    
                    if (waypoint == null) {
                        $(".btn-mod-wp", $menu).remove();
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
