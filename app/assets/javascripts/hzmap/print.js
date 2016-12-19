// Container for map bounds so we can reset it after print
var mapBounds = {};
var mapCenter = {};
var mapZoom = null;

// Catch control+p and re-layout page for printing
$(document).bind("keydown", function(e){
  if((e.ctrlKey || e.metaKey) && e.keyCode === 80){
    catchPrintEvent(1000);
  }
});

// Listener for map icon click
$(function() {
  $('#map-print').click(function(event) {
    event.preventDefault();
    console.log('print button selected');
    catchPrintEvent(1000);
  });
});

// Handle the print event
function catchPrintEvent(wait){
  beforePrint();
  window.setTimeout(function(){
    window.print();
  }, wait);
}

// Web-kit
var mediaQueryList = window.matchMedia('print');
mediaQueryList.addListener(function(mql){
  if (!mql.matches) {
      afterPrint();
  } else {
    // catchPrintEvent(2000);
  }
});

// window.onbeforeprint = function() {
//   catchPrintEvent(1000);
// };
// window.onafterprint = function() {
//   afterPrint(mapBounds);
// };


// Rebuild the map before printing
function beforePrint() {
  mapBounds = map.getBounds();
  mapCenter = map.getCenter();
  mapZoom = map.getZoom();

  $('.map-body').addClass('printable-map');
  google.maps.event.trigger(map, 'resize');
  map.fitBounds(mapBounds);

  if (mapMarkers.length > 0){
    map.setCenter(mapMarkers[0].position);
  } else {
    map.setCenter(mapCenter);
  }

  sidebar.close();

  $('#sidebar button.usa-accordion-button').map(clickAccordion);
}


//reset the map after print
function afterPrint() {
  console.log('After printing: ');
  $('.map-body').removeClass('printable-map');
  google.maps.event.trigger(map, 'resize');
  map.setCenter(mapCenter);
  map.setZoom(mapZoom);
  sidebar.open();
  $('#sidebar button.usa-accordion-button').map(clickAccordion);
}

// Helper for triggering accordions
function clickAccordion(index, el){
  $(el).trigger('click');
}
