//defining global variables for hubzone map controllers
var map = {}; //the map object
var infoWindow = {}; //infowindow object
var apiKey = '<%= MAP_CONFIG[:google_api_key] %>'; //google maps api key
var googleCDNURL = 'https://maps.googleapis.com/maps/api/js?key=<%=MAP_CONFIG[:google_api_key]%>';
var wmsGroundOverlay = {
  'hz_current': [],
  'indian_lands': []
};

var geomWFSSettings = JSON.parse('<%= MAP_CONFIG[:geomWFSSettings].to_json %>');

//create the map on load, when idle, jump to updateMap to get features
/* exported initMap */
function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 35.5, lng: -97.5},
    zoom: 9,
    zoomControl: true,
    mapTypeControlOptions: {
      mapTypeIds: ['hz_map', 'roadmap', 'satellite' ],
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
    }
  });

  //adds in the hz style into the basemap picker
  var hzStyledMap = new google.maps.StyledMapType(hzBaseMapStyle, {name: 'Default'});
  map.mapTypes.set('hz_map', hzStyledMap);
  map.setMapTypeId('hz_map');

  //adds the map legend
  map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(document.getElementById('legend'));

  // adds listener that triggers whenever the map is idle to update with new features.
  google.maps.event.addListener(map, 'idle', updateIdleMap);

  map.addListener('click', catchMapClick);

  //returns the map
  return map;
}

function updateIdleMap(mapScope){
  mapScope = mapScope || this;
  //for each layer defined in the wmsGroundOverlay object call the fetchNewWMS function
  // update the WMS call for that layer
  Object.keys(wmsGroundOverlay).map(function(layer){
    fetchNewWMS({
      mapScope: mapScope,
      layer: layer
    });
  });
}

function fetchNewWMS(options){
  //get the map extents and build URL
  var bbox = getBbox(options.mapScope);
  var imageBounds = getImageBounds(bbox);
  var layer = options.layer;

  var url = buildWMSUrl({
    layer: layer,
    bbox: bbox
  });

  //push a new groundOverlay into the wmsGroundOverlay array container
  wmsGroundOverlay[layer].push(new google.maps.GroundOverlay(
      url,
      imageBounds
  ));

  //update WMS layers, removing old and adding new to the map
  updateLayerWMSOverlay({
    layer: layer, 
    mapScope: options.mapScope
  });
}

function getBbox(mapScope) {
  //get the bounding box of the current map and parse as a string
  var mapBounds = mapScope.getBounds();
  var NELat = mapBounds.getNorthEast().lat();
  var NELng = mapBounds.getNorthEast().lng();
  var SWLat = mapBounds.getSouthWest().lat();
  var SWLng = mapBounds.getSouthWest().lng();
  return [SWLng, SWLat, NELng, NELat].join(',');
}

function getImageBounds(bbox){
  var bboxArr = bbox.split(',');
  var imageBounds = createGoogleLatLngBounds(
                      parseFloat(bboxArr[0]),
                      parseFloat(bboxArr[1]),
                      parseFloat(bboxArr[2]),
                      parseFloat(bboxArr[3])
  );
  return imageBounds;
}

// var currentZoom = mapScope.getZoom();
function getTableBasedOnZoomLevel(currentZoom){
  var table = geomWFSSettings.tableHighRes;
  if (currentZoom >= 12) {
    table = geomWFSSettings.tableHighRes;
  } else if (currentZoom >= 10){
    table = geomWFSSettings.tableLowRes;
  } else if (currentZoom >= 6){
    table = geomWFSSettings.tableLowerRes;
  } else {
    table = geomWFSSettings.tableLowestRes;
  }
  return table;
}

//helper for building google lat lng bounds objectfrom a set of lat long coordinates
//coordinate order corresponds to min X, min Y, max X, max Y
function createGoogleLatLngBounds(SWLng, SWLat, NELng, NELat){
  return new google.maps.LatLngBounds(
      new google.maps.LatLng(SWLat, SWLng),
      new google.maps.LatLng(NELat, NELng)
    );
}

// builds out the custom wms url
function buildWMSUrl(options){
  var url = "http://localhost:8080/geoserver/hubzone-test/wms?service=WMS";
  url += "&REQUEST=GetMap"; 
  url += "&SERVICE=WMS";    
  url += "&VERSION=1.1.0";    
  url += "&LAYERS=" + "hubzone-test:" + options.layer; 
  url += "&FORMAT=image/png" ; 
  url += "&TRANSPARENT=TRUE";
  url += "&SRS=EPSG:4326";      
  url += "&BBOX=" + options.bbox;
  url += "&WIDTH=" + $('#map').width();         
  url += "&HEIGHT=" + $('#map').height();
  url += ('&SLD_BODY=' + xml_styles[options.layer]);
  return url;             
}

//helper function for updating a single layer's WMS overlay
function updateLayerWMSOverlay(options){
  var layer = options.layer;

  if (wmsGroundOverlay[layer].length === 1){
    wmsGroundOverlay[layer][0].setMap(options.mapScope);
  } else if (wmsGroundOverlay[layer].length === 2){
    wmsGroundOverlay[layer][1].setMap(options.mapScope);
    wmsGroundOverlay[layer][0].setMap(null);
    wmsGroundOverlay[layer].shift();
  }
  wmsGroundOverlay[layer][0].addListener('click', catchMapClick);  
}

// turn latlng object into url
function catchMapClick(clickEvent){
  var clicklng = clickEvent.latLng.lng();
  var clicklat = clickEvent.latLng.lat();
  var url = "/search?latlng=" + clicklat + ',' + clicklng;
  $.ajax({
    url: url
  });
  return url;
}

//jump to location on the map based on the geocode viewport object
/* exported jumpToLocation */
function jumpToLocation(geocodeLocation){
  if (geocodeLocation.viewport){
    var newBounds = createGoogleLatLngBounds(
                      geocodeLocation.viewport.southwest.lng,
                      geocodeLocation.viewport.southwest.lat,
                      geocodeLocation.viewport.northeast.lng,
                      geocodeLocation.viewport.northeast.lat
      );
    mapScope.fitBounds(newBounds);
  }
}
