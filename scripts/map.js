$(window).on('load', function() {
  var documentSettings = {};
  var group2color = {};

  var completePoints = false;

// Given a collection of points, determines the layers based on 'Group' column in the spreadsheet.
 
  function determineLayers(points) {
    var groups = [];	  
    var layers = {};

    for (var i in points) {
      var group = points[i].Group;
      if (group && groups.indexOf(group) === -1) {
        groups.push(group);

        group2color[ group ] = points[i]['Marker Icon'].indexOf('.') > 0
          ? points[i]['Marker Icon']
          : points[i]['Marker Color'];
      }
    }

// if none of the points have named layers, return no layers, or create the layer group and add it to the map
    if (groups.length === 0) {
      layers = undefined;
    } else {
      for (var i in groups) {
        var name = groups[i];
        layers[name] = L.layerGroup();      
        layers[name].addTo(map); // if commented out, data table and layer.control show no data, but markers still show on the map, and marker.layerRemove button still works      
      }
    }
    return layers;
  }

// Assigns points to appropriate layers and clusters them if needed
	
  function mapPoints(points, layers) {
    var markerArray = [];
    
    for (var i in points) {
      var point = points[i];	    

// Create Icon
	    
      var iconSize = point['Custom Size'];
	    
      var size = (iconSize.indexOf('x') > 0)
        ? [parseInt(iconSize.split('x')[0]), parseInt(iconSize.split('x')[1])]
        : [32, 32];   
      var anchor = [size[0] / 2, size[1]];

      var icon = L.icon({
	    iconUrl: point['Marker Icon'],
            iconSize: size,
            iconAnchor: anchor
            });
	          
      if (point.Latitude !== '' && point.Longitude !== '') {
     
// DEFINE THE PARAMETERS OF THE MARKER, AND ADD IT TO THE MAP        
        var marker = L.marker([point.Latitude, point.Longitude], {name: point['Name'], group: point['Group'], descript: point['Description'], bimage: point['Image'], harvest: point['Harvest'], hname: point['HName'], cplant: point['CPlant'], icon: icon})
	.on('click', markerOnClick)  
        .addTo(map);
        
// DEFINE THE FEATURES FOR THE MODAL POPUP	
        function markerOnClick(e)
          {
            var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Hawaiian Name:</th><td>" + this.options.hname + "</td></tr>" + "<tr><th>Canoe Plant:</th><td>" + this.options.cplant + "</td></tr>" + "<tr><th>Harvest:</th><td>" + this.options.harvest + "</td></tr>" + "<table>";
            $("#feature-title").html(this.options.name);
//            $("#feature-back").html("<img src=" + this.options.bimage + "></img>");
            $("#feature-info").html(content);
            $("#bottom_modal").modal("show");
            var bgimgurlm = 'url(' + this.options.bimage + ')';
            var divm = document.getElementById("bgimage");
            divm.style.backgroundImage = bgimgurlm;
            divm.style.backgroundRepeat = "no-repeat";
            divm.style.backgroundSize = "contain";  
          }
	      
// Add marker to it's individual layer group        
        if (layers !== undefined && layers.length !== 1) {
          marker.addTo(layers[point.Group]);
        }
        
// Then also add marker to an array that will hold all markers	    
        markerArray.push(marker);  
      }
    }
	  
// For group clustering    
    var group = L.featureGroup(markerArray);
    var clusters = (getSetting('_markercluster') === 'on') ? true : false;
     
// if layers.length === 0, add points to map instead of layer
    if (layers === undefined || layers.length === 0) {
      map.addLayer(
        clusters
        ? L.markerClusterGroup({ disableClusteringAtZoom: 17 }).addLayer(group).addTo(map)
        : group
      );
    } else {
      if (clusters) {
	      
// Add multilayer cluster support
        multilayerClusterSupport = L.markerClusterGroup({ disableClusteringAtZoom: 17 }).layerSupport();
        multilayerClusterSupport.addTo(map);
             
        for (i in layers) {
          multilayerClusterSupport.checkIn(layers[i]);
          layers[i].addTo(map);               
        }
      }
	    
// BEGIN "LEGEND" LAYER.CONTROL CODE 
      var pos = (getSetting('_pointsLegendPos') == 'off')
        ? 'topleft'
        : getSetting('_pointsLegendPos');

      var pointsLegend = L.control.layers(null, layers, {    
	collapsed: true,      
        position: pos,
      });
      
      if (getSetting('_pointsLegendPos') !== 'off') {
        pointsLegend.addTo(map);
        pointsLegend._container.id = 'points-legend';
//        pointsLegend._container.className += ' ladder';
      }
    }
        
    $('#points-legend').prepend('<h6 class="pointer"><b>' + getSetting('_pointsLegendTitle') + '</b></h6>');
//    $(".leaflet-control-layers-overlays").prepend("<label><b>Trees of Interest</b></label>");
    if (getSetting('_pointsLegendIcon') != '') {
      $('#points-legend h6').prepend('<span class="legend-icon"><i class="fas '
        + getSetting('_pointsLegendIcon') + '"></i></span>');
    }
        
// END LEGEND CODE

	  
// BEGIN TABLE CODE
    
    var displayTable = getSetting('_displayTable') == 'on' ? true : false;
          
// Display table with active points if specified
    var columns = getSetting('_tableColumns').split(',')
                  .map(Function.prototype.call, String.prototype.trim);
      
   if (displayTable && columns.length > 1) {
	
      tableHeight = trySetting('_tableHeight', 40);
      if (tableHeight < 10 || tableHeight > 90) {tableHeight = 40;}
      $('#map').css('height', (100 - tableHeight) + 'vh');
      map.invalidateSize();
        
// Set background (and text) color of the table header
      var colors = getSetting('_tableHeaderColor').split(',');
      if (colors[0] != '') {
        $('table.display').css('background-color', colors[0]);
        if (colors.length >= 2) {
          $('table.display').css('color', colors[1]);
        }
      }
         
// Update table every time the map is moved/zoomed or point layers are toggled
      map.on('moveend', updateTable);
      map.on('layeradd', updateTable);
      map.on('layerremove', updateTable);
        
// Clear table data and add only visible markers to it
      function updateTable() {
        var pointsVisible = [];
        for (i in points) {
          if (map.hasLayer(layers[points[i].Group]) &&
              map.getBounds().contains(L.latLng(points[i].Latitude, points[i].Longitude))) {
            pointsVisible.push(points[i]);
          }
        }
         
        tableData = pointsToTableData(pointsVisible);
         
        table.clear();
        table.rows.add(tableData);
        table.draw();
      }
        
// Convert Leaflet marker objects into DataTable array
      function pointsToTableData(ms) {
        var data = [];
        for (i in ms) {
          var a = [];
          for (j in columns) {
            a.push(ms[i][columns[j]]);
          }
          data.push(a);
        }
        return data;
      }
        
// Transform columns array into array of title objects
      function generateColumnsArray() {
        var c = [];
        for (i in columns) {
          c.push({title: columns[i]});
        }
        return c;
      }
    
// Initialize DataTable
      var table = $('#maptable').DataTable({
        paging: false,
        scrollCollapse: true,
        scrollY: 'calc(' + tableHeight + 'vh - 40px)',
        info: false,
        searching: false,
        columns: generateColumnsArray(),
      });
    }
// END OF TABLE MAKING
	  
    completePoints = true;
    return group;
  }

// END OF POINTS-MARKERS CODE

// BEGIN GOOGLE SHEET CODE
  	
  function onMapDataLoad(options, points) {
  
    createDocumentSettings(options);
  
    document.title = getSetting('_mapTitle');
	  
    addBaseMap();
  
// Add point markers to the map
    var layers;
    var group = '';
    if (points && points.length > 0) {
      layers = determineLayers(points);
      group = mapPoints(points, layers);
    } else {
      completePoints = true;
    }
     
// Add location control
    if (getSetting('_mapMyLocation') !== 'off') {
      var locationControl = L.control.locate({
        keepCurrentZoomLevel: true,
        returnToPrevBounds: true,
        position: getSetting('_mapMyLocation')
      }).addTo(map);
    }
    
// Append icons to categories in markers legend
    $('#points-legend label span').each(function(i) {
      var g = $(this).text().trim();
      var legendIcon = (group2color[ g ].indexOf('.') > 0)
        ? '<img src="' + group2color[ g ] + '" class="markers-legend-icon">'
        : '&nbsp;<i class="fas fa-map-marker" style="color: '
          + group2color[ g ]
          + '"></i>';
      $(this).prepend(legendIcon);
    });
      
// When all processing is done, hide the loader and make the map visible
    showMap();
     
    function showMap() {
      if (completePoints) {
        $('.ladder h6').append('<span class="legend-arrow"><i class="fas fa-chevron-down"></i></span>');
        $('.ladder h6').addClass('minimize');
         
        $('.ladder h6').click(function() {
          if ($(this).hasClass('minimize')) {
            $('.ladder h6').addClass('minimize');
            $('.legend-arrow i').removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $(this).removeClass('minimize')
              .parent().find('.legend-arrow i')
              .removeClass('fa-chevron-down')
              .addClass('fa-chevron-up');
          } else {
            $(this).addClass('minimize');
            $(this).parent().find('.legend-arrow i')
              .removeClass('fa-chevron-up')
              .addClass('fa-chevron-down');
          }
        });
        
        $('.ladder h6').first().click();     
        $('#map').css('visibility', 'visible');
        $('.loader').hide();
          
      }
    }
  }
// Closes onMapDataLoad Function
  
// Changes map attribution (author, GitHub repo, email etc.) in bottom-right
 
//  function changeAttribution() {
//    var attributionHTML = $('.leaflet-control-attribution')[0].innerHTML;
//    var credit = 'View <a href="' + googleDocURL + '" target="_blank">data</a>';
//    var name = getSetting('_authorName');
//    var url = getSetting('_authorURL');

//    if (name && url) {
//      if (url.indexOf('@') > 0) { url = 'mailto:' + url; }
//      credit += ' by <a href="' + url + '">' + name + '</a> | ';
//    } else if (name) {
//      credit += ' by ' + name + ' | ';
//    } else {
//      credit += ' | ';
//    }
//   credit += 'View <a href="' + getSetting('_githubRepo') + '">code</a>';
//    if (getSetting('_codeCredit')) credit += ' by ' + getSetting('_codeCredit');
//    credit += ' with ';
//    $('.leaflet-control-attribution')[0].innerHTML = credit + attributionHTML;
//  }
  
  
// Loads the basemap and adds it to the map

//	var CartoDBPositron = 
	
  function addBaseMap() {
	  
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
	subdomains: 'abcd',
	maxZoom: 20
      }).addTo(map);	  
//    var basemap = trySetting('_tileProvider', 'CartoDB.Positron');
//    L.tileLayer.provider(basemap, {
//      maxZoom: 20
//    }).addTo(map);
//    L.control.attribution({
//      position: trySetting('_mapAttribution', 'bottomright')
//    }).addTo(map);
	  
  }
    
// Returns the value of a setting s getSetting(s) is equivalent to documentSettings[constants.s]
  
  function getSetting(s) {
    return documentSettings[constants[s]];
  }



/**
 * Returns the value of setting named s from constants.js
 * or def if setting is either not set or does not exist
 * Both arguments are strings
 * e.g. trySetting('_authorName', 'No Author')
 */
  function trySetting(s, def) {
    s = getSetting(s);
    if (!s || s.trim() === '') { return def; }
    return s;
  }

  
// Triggers the load of the spreadsheet and map creation
 
   var mapData;

   $.ajax({
       url:'./csv/Options.csv',
       type:'HEAD',
       error: function() {
         // Options.csv does not exist in the root level, so use Papa Parse to fetch data from the Google sheet

         if (typeof googleApiKey !== 'undefined' && googleApiKey) {

          var parse = function(res) {
            return Papa.parse(Papa.unparse(res[0].values), {header: true} ).data;
          }

          var apiUrl = 'https://sheets.googleapis.com/v4/spreadsheets/'
          var spreadsheetId = googleDocURL.indexOf('/d/') > 0
            ? googleDocURL.split('/d/')[1].split('/')[0]
            : googleDocURL

          $.getJSON(
            apiUrl + spreadsheetId + '?key=' + googleApiKey
          ).then(function(data) {
              var sheets = data.sheets.map(function(o) { return o.properties.title })

              if (sheets.length === 0 || !sheets.includes('Options')) {
                'Could not load data from the Google Sheet'
              }

              // First, read 2 sheets: Options, Points
              $.when(
                $.getJSON(apiUrl + spreadsheetId + '/values/Options?key=' + googleApiKey),
                $.getJSON(apiUrl + spreadsheetId + '/values/Points?key=' + googleApiKey)
                
              ).done(function(options, points) {

                // Which sheet names contain polygon data?
                var polygonSheets = sheets.filter(function(name) { return name.indexOf('Polygons') === 0})
                
                // Define a recursive function to fetch data from a polygon sheet
                var fetchPolygonsSheet = function(polygonSheets) {
                
                  // Load map once all polygon sheets have been loaded (if any)
                  if (polygonSheets.length === 0) {
                    onMapDataLoad(
                      parse(options),
                      parse(points)
                    )
                  } else {
                    
                    // Fetch another polygons sheet
                    $.getJSON(apiUrl + spreadsheetId + '/values/' + polygonSheets.shift() + '?key=' + googleApiKey, function(data) {
//                      createPolygonSettings( parse([data]) )
                      fetchPolygonsSheet(polygonSheets)
                    })
                  }
                }
                 
                // Start recursive function
                fetchPolygonsSheet( polygonSheets )
              
              })
            }
          )

         } else {
          alert('You load data from a Google Sheet, you need to add a free Google API key')
         }

       },

       /*
       Loading data from CSV files.
       */
       success: function() {

        var parse = function(s) {
          return Papa.parse(s[0], {header: true}).data
        }
      
        $.when(
          $.get('./csv/Options.csv'),
          $.get('./csv/Points.csv')
        ).done(function(options, points) {
      
          function loadPolygonCsv(n) {
      
            $.get('./csv/Polygons' + (n === 0 ? '' : n) + '.csv', function(data) {
              createPolygonSettings( parse([data]) )
              loadPolygonCsv(n+1)
            }).fail(function() { 
              // No more sheets to load, initialize the map  
              onMapDataLoad( parse(options), parse(points))
            })
      
          }
      
          loadPolygonCsv(0)
      
        })

       }
   });

  /**
   * Reformulates documentSettings as a dictionary, e.g.
   * {"webpageTitle": "Leaflet Boilerplate", "infoPopupText": "Stuff"}
   */
  function createDocumentSettings(settings) {
    for (var i in settings) {
      var setting = settings[i];
      documentSettings[setting.Setting] = setting.Customize;
    }
  }

  

  // Returns a string that contains digits of val split by comma evey 3 positions
  // Example: 12345678 -> "12,345,678"
  function comma(val) {
      while (/(\d+)(\d{3})/.test(val.toString())) {
          val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
      }
      return val;
  }
	  
});
