var map, featureList, avoSearch = [], banSearch = [], uluSearch = [];

$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});

if ( !("ontouchstart" in window) ) {
  $(document).on("mouseover", ".feature-row", function(e) {
    highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
  });
}

$(document).on("mouseout", ".feature-row", clearHighlight);

//opens about page popup
$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

//$("#full-extent-btn").click(function() {
//  $("#aboutModal").modal("show");
//  $(".navbar-collapse.in").collapse("hide");
//  return false;
//  map.fitBounds(boroughs.getBounds());
//  map.fitBounds(markers.getBounds().pad(0.5))
//  baseLayers["Satellite Map"].addTo(map);
//  $(".navbar-collapse.in").collapse("hide");
//  return false;
});


// $('.leaflet-control-layers input').get(i).click()


//opens the side bar
$("#list-btn").click(function() {
  animateSidebar();
  return false;
});

//opens the about page popup on small screens
$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

//opens the side bar on small screens
$("#sidebar-toggle-btn").click(function() {
  animateSidebar();
  return false;
});

//closes side bar; located on side bar
$("#sidebar-hide-btn").click(function() {
  animateSidebar();
  return false;
});

//side bar animation effect and map tile adjustments
function animateSidebar() {
  $("#sidebar").animate({
    width: "toggle"
  }, 350, function() {
    map.invalidateSize();
  });
}

//map tile adjustments
function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

// Clears the blue selected marker highlight
function clearHighlight() {
  highlight.clearLayers();
}

//when sidebar is clicked, gets lat-long and zooms in
function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 20);
  layer.fire("click");
  
//...and hide sidebar if on small screens
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}


// Synch the sidebar with whats show on the screen
function syncSidebar() {
  /* First Empty sidebar features */
  $("#feature-list tbody").empty();

  /* Then Loop through avo layer and add only features which are in the map bounds */
  /* Contains sidebar icons size settings */
  avo.eachLayer(function (layer) {
    if (map.hasLayer(avoLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/avopin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });
  
    /* Loop through ulu layer and add only features which are in the map bounds */
  ulu.eachLayer(function (layer) {
    if (map.hasLayer(uluLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/ulupin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });

  /* Loop through ban layer and add only features which are in the map bounds */
  ban.eachLayer(function (layer) {
    if (map.hasLayer(banLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/banpin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });

  // Update list.js featureList
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
}

// Define Basemap Layers
var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
});

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});



// Define Overlay Layers

//makes blue circle "highlight" on selected point
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 5
};

// Single marker cluster layer to hold all clusters
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

// Empty layer placeholder to add to layer control for listening when to add/remove avo to markerClusters layer
var avoLayer = L.geoJson(null);
var avo = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
        icon: L.icon({
        iconUrl: "assets/img/greeno.png",
        iconSize: [14, 14],                                //map sizing
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Hawaiian Name:</th><td>" + feature.properties.hname + "</td></tr>" + "<tr><th>Canoe Plant:</th><td>" + feature.properties.cplant + "</td></tr>" + "<tr><th>Harvest:</th><td>" + feature.properties.harvest + "</td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.NAME);
          $("#feature-back").html(feature.properties.backimage);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
          var bgimgurla = 'url(' + feature.properties.backimage + ')';
          var diva = document.getElementById("bgimage");
          diva.style.backgroundImage = bgimgurla;
          diva.style.backgroundRepeat = "no-repeat";
          diva.style.backgroundSize = "contain";
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/avopin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      avoSearch.push({
        name: layer.feature.properties.NAME,
        source: "avo",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});
$.getJSON("data/avo.geojson", function (data) {
  avo.addData(data);
  map.addLayer(avoLayer);
});


/* Empty layer placeholder to add to layer control for listening when to add/remove ulu to markerClusters layer */
var uluLayer = L.geoJson(null);
var ulu = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/blueo.png",
        iconSize: [14, 14],                                //map sizing
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Hawaiian Name:</th><td>" + feature.properties.hname + "</td></tr>" + "<tr><th>Canoe Plant:</th><td>" + feature.properties.cplant + "</td></tr>" + "<tr><th>Harvest:</th><td>" + feature.properties.harvest + "</td></tr>" + "<table>";

      layer.on({  
        click: function (e) {
          $("#feature-title").html(feature.properties.NAME);
          $("#feature-back").html(feature.properties.backimage);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
          var bgimgurlu = 'url(' + feature.properties.backimage + ')';
          var divu = document.getElementById("bgimage");
          divu.style.backgroundImage = bgimgurlu;
          divu.style.backgroundRepeat = "no-repeat";
          divu.style.backgroundSize = "contain";
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/ulupin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      uluSearch.push({
        name: layer.feature.properties.NAME,
        source: "ulu",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});
$.getJSON("data/ulu.geojson", function (data) {
  ulu.addData(data);
  map.addLayer(uluLayer);
});


/* Empty layer placeholder to add to layer control for listening when to add/remove ban to markerClusters layer */
var banLayer = L.geoJson(null);
var ban = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "assets/img/yellowo.png",
        iconSize: [14, 14],                                   // map sizing
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.NAME,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Hawaiian Name:</th><td>" + feature.properties.hname + "</td></tr>" + "<tr><th>Canoe Plant:</th><td>" + feature.properties.cplant + "</td></tr>" + "<tr><th>Harvest:</th><td>" + feature.properties.harvest + "</td></tr>" + "<table>";

      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.NAME);
          $("#feature-back").html(feature.properties.backimage);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));
          var bgimgurlm = 'url(' + feature.properties.backimage + ')';
          var divm = document.getElementById("bgimage");
          divm.style.backgroundImage = bgimgurlm;
          divm.style.backgroundRepeat = "no-repeat";
          divm.style.backgroundSize = "contain";
        }
      });
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="16" src="assets/img/banpin.png"></td><td class="feature-name">' + layer.feature.properties.NAME + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      banSearch.push({
        name: layer.feature.properties.NAME,
        source: "ban",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});
$.getJSON("data/ban.geojson", function (data) {
  ban.addData(data);
  map.addLayer(banLayer);
});


// Make the Leaflet Map
map = L.map("map", {
  zoom: 16,
  center: [19.40893, -154.914],
  layers: [googleSat, markerClusters, highlight],
  zoomControl: false,
  attributionControl: false
});

// Layer control listeners that allow for a single markerClusters layer
map.on("overlayadd", function(e) {
  if (e.layer === avoLayer) {
    markerClusters.addLayer(avo);
    syncSidebar();
  }
  if (e.layer === uluLayer) {
    markerClusters.addLayer(ulu);
    syncSidebar();
  }
  if (e.layer === banLayer) {
    markerClusters.addLayer(ban);
    syncSidebar();
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === avoLayer) {
    markerClusters.removeLayer(avo);
    syncSidebar();
  }
  if (e.layer === uluLayer) {
    markerClusters.removeLayer(ulu);
    syncSidebar();
  }
  if (e.layer === banLayer) {
    markerClusters.removeLayer(ban);
    syncSidebar();
  }
});

// Sync sidebar list to only show features in current map bounds
map.on("moveend", function (e) {
  syncSidebar();
});

// Clear feature highlight when map is clicked
map.on("click", function(e) {
  highlight.clearLayers();
});

// Zoom buttons on map
var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);


/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

// Define Map Base Layers
var baseLayers = {
  //"Old Sat Map": Esri_WorldImagery,
  "Satellite Map": googleSat,
  "Street Map": cartoLight
};

// Define Overlays
var groupedOverlays = {
  "Trees of Interest": {
    "<img src='assets/img/avopin.png' width='24' height='24'>&nbsp;Avacado": avoLayer,              //sizes for control box
    "<img src='assets/img/banpin.png' width='24' height='24'>&nbsp;Banana": banLayer,
    "<img src='assets/img/ulupin.png' width='24' height='24'>&nbsp;Ulu": uluLayer
  }
};

// Create Control Box / Legend
var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);


/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

// Typeahead search functionality
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();


  var avoBH = new Bloodhound({
    name: "avo",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: avoSearch,
    limit: 10
  });
  
  var uluBH = new Bloodhound({
    name: "ulu",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: uluSearch,
    limit: 10
  });

  var banBH = new Bloodhound({
    name: "ban",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: banSearch,
    limit: 10
  });

  var geonamesBH = new Bloodhound({
    name: "GeoNames",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: {
      url: "http://api.geonames.org/searchJSON?username=bootleaf&featureClass=P&maxRows=5&countryCode=US&name_startsWith=%QUERY",
      filter: function (data) {
        return $.map(data.geonames, function (result) {
          return {
            name: result.name + ", " + result.adminCode1,
            lat: result.lat,
            lng: result.lng,
            source: "GeoNames"
          };
        });
      },
      ajax: {
        beforeSend: function (jqXhr, settings) {
          settings.url += "&east=" + map.getBounds().getEast() + "&west=" + map.getBounds().getWest() + "&north=" + map.getBounds().getNorth() + "&south=" + map.getBounds().getSouth();
          $("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
        },
        complete: function (jqXHR, status) {
          $('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
        }
      }
    },
    limit: 10
  });
  avoBH.initialize();
  uluBH.initialize();
  banBH.initialize();
  geonamesBH.initialize();

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  },{
    name: "avo",
    displayKey: "name",
    source: avoBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/avopin.png' width='44' height='44'>&nbsp;avo</h4>", //unknown size
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }, {
    name: "ulu",
    displayKey: "name",
    source: uluBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/ulupin.png' width='44' height='44'>&nbsp;ulu</h4>", //unknown size
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }, {
    name: "ban",
    displayKey: "name",
    source: banBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/banpin.png' width='14' height='18'>&nbsp;ban</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }, {
    name: "GeoNames",
    displayKey: "name",
    source: geonamesBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "avo") {
      if (!map.hasLayer(avoLayer)) {
        map.addLayer(avoLayer);
      }
      map.setView([datum.lat, datum.lng], 17);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if (datum.source === "ulu") {
      if (!map.hasLayer(uluLayer)) {
        map.addLayer(uluLayer);
      }
      map.setView([datum.lat, datum.lng], 17);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if (datum.source === "ban") {
      if (!map.hasLayer(banLayer)) {
        map.addLayer(banLayer);
      }
      map.setView([datum.lat, datum.lng], 17);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if (datum.source === "GeoNames") {
      map.setView([datum.lat, datum.lng], 14);
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}
