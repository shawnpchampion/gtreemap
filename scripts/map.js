$(window).on('load', function() {

  var group2color = {};

  var CartoDBPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
  });	   
	
  var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
      maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3']
  });
	
  var baseMaps = {
      "Street Map": CartoDBPositron,
      "Satellit": googleSat	  
  };	
	
  var completePoints = false;

// Determines the layers based on 'Group' column in the spreadsheet.
 
  function determineLayers(points) {
    var groups = [];	  
    var layers = {};
  
    for (var i in points) {
      var group = points[i].Group;
      if (group && groups.indexOf(group) === -1) {
        groups.push(group);	  
        group2color[ group ] = points[i]['Marker Icon'];          
      }
    }
  
// Create the layer group and add it to the map
	  
      for (var i in groups) {
        var name = groups[i];
        layers[name] = L.layerGroup();      
        layers[name].addTo(map); // if this is commented out, data table and layer.control show no data, but markers still show on the map, and marker.layerRemove button still works      
      }
    return layers;
  }

// Assigns points to appropriate layers and cluster them
	
  function mapPoints(points, layers) {
    var markerArray = [];
    
    for (var i in points) {
      var point = points[i];	    
      
// Create Icon
          
      var iconSize = point['Custom Size'];  
      
      var size = [parseInt(iconSize.split('x')[0]), parseInt(iconSize.split('x')[1])];
	    
      var anchor = [size[0] / 2, size[1]];
          
      var icon = L.icon({
        iconUrl: point['Marker Icon'],
        iconSize: size,
        iconAnchor: anchor
        });
                
      if (point.Latitude !== '' && point.Longitude !== '') {
     
// DEFINE THE PARAMETERS OF THE MARKER, AND ADD IT TO THE MAP 
	     
        var marker = L.marker([point.Latitude, point.Longitude], {name: point['Name'], group: point['Group'], descript: point['Description'], bimage: point['Image'], harvest: point['Harvest'], hname: point['HName'], cplant: point['CPlant'], icon: icon})									
       
//	marker = L.circleMarker([point.Latitude, point.Longitude], {color: point['Color'], radius: 3, name: point['Name'], group: point['Group'], descript: point['Description'], bimage: point['Image'], harvest: point['Harvest'], hname: point['HName'], tags: point['CPlant']})									  
	.on('click', markerOnClick)  
        .addTo(map);
	      
// DEFINE THE FEATURES FOR THE MODAL POPUP	
	      
        function markerOnClick(e)
          {
            var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Hawaiian Name:</th><td>" + this.options.hname + "</td></tr>" + "<tr><th>Canoe Plant:</th><td>" + this.options.cplant + "</td></tr>" + "<tr><th>Harvest:</th><td>" + this.options.harvest + "</td></tr>" + "<table>";
            $("#feature-title").html(this.options.name);
//            $("#feature-title").html(point['Name']);
            $("#feature-info").html(content);
//            $("#bottom_modal").modal("show");
	    $("#featureModal").modal("show");	  
            var bgimgurlm = 'url(' + this.options.bimage + ')';
            var divm = document.getElementById("bgimage");
            divm.style.backgroundImage = bgimgurlm;
            divm.style.backgroundRepeat = "no-repeat";
            divm.style.backgroundSize = "contain";  
          }
	      
// Add marker to it's individual layer group, and to an array that holds all markers	      
      
        marker.addTo(layers[point.Group]);
      
        markerArray.push(marker);  
      
      }
    }
	  
// For group clustering: adjust with "true" or "false"    
	  
    var group = L.featureGroup(markerArray);

    var clusters = false;
	  
// if layers.length === 0, add points to map instead of layer
	  
    if (layers === undefined || layers.length === 0) {
      map.addLayer(
        clusters
        ? L.markerClusterGroup({ disableClusteringAtZoom: 19 }).addLayer(group).addTo(map)
        : group
      );
    } else {
      if (clusters) {
	      
// Add multilayer cluster support
	      
        multilayerClusterSupport = L.markerClusterGroup.layerSupport({ disableClusteringAtZoom: 19, spiderfyOnMaxZoom: false, showCoverageOnHover: false });
        multilayerClusterSupport.addTo(map);
             
        for (i in layers) {
          multilayerClusterSupport.checkIn(layers[i]);
          layers[i].addTo(map);               
        }
      }

// BEGIN "LEGEND" LAYER.CONTROL CODE: 
	    
//      var pointsLegend = L.control.layers(baseMaps, layers, {    
      var pointsLegend = L.control.layers(null, layers, { 
	collapsed: true,      
        position: 'topright',
      });
      
      pointsLegend.addTo(map);
      pointsLegend._container.id = 'points-legend';
	    
    }
	  
//    L.easyButton( 'fa-star', function(){
//      map.removeLayer(googleSat);
//    }).addTo(map);
	  
//    L.easyButton( 'fa-star', function(){
//      map.addLayer(googleSat);
//    }).addTo(map);
	  
        
//    $('#points-legend').prepend('<h6 class="pointer"><b>' + getSetting('_pointsLegendTitle') + '</b></h6>');
//    $(".leaflet-control-layers-overlays").prepend("<label><b>Trees of Interest</b></label>");
//    if (getSetting('_pointsLegendIcon') != '') {
//      $('#points-legend h6').prepend('<span class="legend-icon"><i class="fas '
//        + getSetting('_pointsLegendIcon') + '"></i></span>');
//    }
        
// END LEGEND CODE

	  
// BEGIN TABLE CODE: Adjust with "true" or "false"
 
    var displayTable = false;	  
          
// Display table with active points
	  
    var columns = 'Name,CPlant,HName'.split(',')
                  .map(Function.prototype.call, String.prototype.trim);
      
   if (displayTable && columns.length > 1) {
	
      tableHeight = 40;	   
      if (tableHeight < 10 || tableHeight > 90) {tableHeight = 40;}
      $('#map').css('height', (100 - tableHeight) + 'vh');
      map.invalidateSize();
         
// Update table every time the map is moved/zoomed or layers are toggled
	   
      map.on('moveend', updateTable);
      map.on('layeradd', updateTable);
      map.on('layerremove', updateTable);
	   
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
  
//  function onMapDataLoad(points) {
      
  function onMapDataLoad(options, points) { 
      
    document.title = 'Kalani Tree Map';	  
 
// Add points to layers and groups
	  
    var layers;
    var group = '';
    if (points && points.length > 0) {
      layers = determineLayers(points);
      group = mapPoints(points, layers);
    } else {
      completePoints = true;
    }
     
// Add Location Control
	  
    var locationControl = L.control.locate({
      keepCurrentZoomLevel: true,
      returnToPrevBounds: true,
      position: 'topleft'
    }).addTo(map);
    
// Append Icons to categories in markers legend
	  
    $('#points-legend label span').each(function(i) {
      var g = $(this).text().trim();
      var legendIcon = '<img src="' + group2color[ g ] + '" class="markers-legend-icon">';     
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
    
// Triggers the load of the spreadsheet and map creation
 
   var mapData;

   $.ajax({
       url:'./csv/Options.csv',
       type:'HEAD',
       
// If Options.csv does not exist in the root level, give error and use Papa Parse to fetch data from the Google sheet
          
       error: function() {
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
                                 
              $.when(
                $.getJSON(apiUrl + spreadsheetId + '/values/Options?key=' + googleApiKey),
                $.getJSON(apiUrl + spreadsheetId + '/values/Points?key=' + googleApiKey)
                
              ).done(function(options, points) {
//	      ).done(function(points) {                    	
                onMapDataLoad(
//                  parse(options),
                  parse(points)
                )
              })
            }
          )
         } else {
          alert('You load data from a Google Sheet, you need to add a free Google API key')
         }
       }    
   });

// Returns a string that contains digits of val split by comma evey 3 positions
// Example: 12345678 -> "12,345,678"
	
  function comma(val) {
      while (/(\d+)(\d{3})/.test(val.toString())) {
          val = val.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
      }
      return val;
  }
	  
});
