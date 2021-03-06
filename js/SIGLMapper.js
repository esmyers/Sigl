//Copyright 2013 USGS Wisconsin Internet Mapping(WiM)
//Author: WiM JS Dev Team
//Created: May 17th, 2013	

//This template has been commented heavily for development purposes. Please delete comments before publishing live mapper code.
//Below are all the dojo.require statements needed for this template mapper. These statements import esri and dijit out-of-box functionality. At bottom are custom wimjits being included.
//This list will vary as features are added to mappers and different Dojo, Esri, or WiM tools are used. 

//07.16.2013 - NE - Add functionality for adding icon and execute zoom to scale.
//06.19.2013 - NE - Updated to create lat/lng scale bar programmatically after map is created and ready.
//06.18.2013 - TR - Added color style to USGSLinks <a> tags
//06.03.2013 - ESM - Adds function to build and display usgs links on user logo click
//dojo.require("wim.LoadingScreen");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Popup");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.symbol");
dojo.require("esri.symbols.SimpleMarkerSymbol");
dojo.require("esri.graphic");
dojo.require("esri.map");
dojo.require("esri.tasks.locator");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.utils");
dojo.require("esri.tasks.query");
dojo.require("esri.tasks.QueryTask");
dojo.require("esri.layers.ImageParameters");
dojo.require("esri.geometry.screenUtils");
//dojo.require("esri.Config");

dojo.require("dijit.form.CheckBox");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.TitlePane");
dojo.require("dijit.Tooltip");
dojo.require("dijit.layout.TabContainer");

//dojo.require("wim.CollapsingContainer");
dojo.require("wim.CollapsingContainerVertical");
dojo.require("wim.ExtentNav");
dojo.require("wim.LatLngScale");
dojo.require("wim.RefreshScreen");



//various global variables are set here (Declare here, instantiate below)     
var map, legendLayers = [];
var identifyTask, identifyParams;
var navToolbar;
var locator;
var PGroupDone;
var paramRequestDone;
var lakeRequestDone;
var stateRequestDone;
var mediaRequestDone;
var projectRequestDone;
var organizationRequestDone;
var objectiveRequestDone;
var lakeRequest2Done;
var stateRequest2Done;
var parameterSelectDone;
var filterQuery;
var filterQueryTask;

var layerDefs = [];
//var siteIdArray = [];
//var siteIds = "";

var tabIndex = 3;

var screenPtX;
var screenPtY;


//PUBLIC IP FOR NEW SIGL INSTANCE
var servicesURL = "http://sigl.wim.usgs.gov:6080/arcgis/rest/services/SIGL/SIGLMapper/MapServer/";
//var servicesURL = "http://54.92.175.17:6080/arcgis/rest/services/SIGL/SIGLMapper/MapServer/";

var endpointRoot = "http://sigl.wim.usgs.gov/LaMPServices/";
//var endpointRoot = "http://54.92.175.17/LaMPServices/";


//REALLY NOT NEEDED RIGHT NOW BUT MAY BE USEFUL IF NEEDING TO VALIDATE DROPDOWNS FOR DEPENDENCY LATER ON
var oldPGroupArray, oldParamArray, oldFromDate, oldToDate, oldResourceArray, oldMediaArray, oldLakeArray, oldStateArray;
//var oldStringParaGrps, oldStringParams, oldStringResource, oldStingMedia, oldStringLake, oldStringState;

$.support.cors = true;

function init() {

    //both server and web browser must be configured to enable CORS.  Allows app to bypass browser same-origin policy.
    //esri.config.defaults.io.corsEnabledServers.push("http://107.20.96.245:6080/");

	
	//esri.config.defaults.io.proxyUrl = "/SIGLProxies/proxy.ashx";
	
	//esri.config.defaults.io.alwaysUseProxy = true;
	
	//sets up the onClick listener for the USGS logo
	dojo.connect(dojo.byId("usgsLogo"), "onclick", showUSGSLinks);
	
    markerSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND, 20,
    new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
    new dojo.Color([249,122,78]), 1.5),
    new dojo.Color([89,89,91,0.2]));

	// a popup is constructed below from the dijit.Popup class, which extends some addtional capability to the InfoWindowBase class.
	var popup = new esri.dijit.Popup({markerSymbol: markerSymbol},dojo.create("div"));
	
	//IMPORANT: map object declared below. Basic parameters listed here. 
	//String referencing container id for the map is required (in this case, "map", in the parens immediately following constructor declaration).
	//Default basemap is set using "basemap" parameter. See API reference page, esri.map Constructor Detail section for parameter info. 
	//For template's sake, extent parameter has been set to contiguous US.
	//sliderStyle parameter has been commented out. Remove comments to get a large slider type zoom tool (be sure to fix CSS to prevent overlap with other UI elements)
	//infoWindow parameter sets what will be used as an infoWindow for a map click. 
	//If using FeatureLayer,an infoTemplate can be set in the parameters of the FeatureLayer constructor, which will automagically generate an infoWindow.	 
	map = new esri.Map("map", {
    	basemap: "topo",
		wrapAround180: true,
		extent: new esri.geometry.Extent({xmin:-10740000,ymin:5000000,xmax:-7000000,ymax:6506000,spatialReference:{wkid:102100}}), 
		slider: true,
		sliderStyle: "small", //use "small" for compact version, "large" for long slider version
		logo:false,
		infoWindow: popup
	});

	//navToolbar constructor declared, which serves the extent navigator tool.
    navToolbar = new esri.toolbars.Navigation(map);
	
	//dojo.connect method (a common Dojo framework construction) used to call mapReady function. Fires when the first or base layer has been successfully added to the map.
    dojo.connect(map, "onLoad", mapReady);
	
	//basemapGallery constructor which serves the basemap selector tool. List of available basemaps can be customized. Here,default ArcGIS online basemaps are set to be available.
	var basemapGallery = new esri.dijit.BasemapGallery({
		showArcGISBasemaps: true,
		map: map
	}, "basemapGallery");
	basemapGallery.startup();

	//basemapGallery error catcher
	dojo.connect(basemapGallery, "onError", function() {console.log("Basemap gallery failed")});
	
	//calls executeSiteIdentifyTask function from a click on the map. 
	dojo.connect(map, "onClick", executeSiteIdentifyTask);

	//LAYER DECLARATION
	var tribalResLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://commons.wim.usgs.gov/arcgis/rest/services/AIR_NDGA/AIR_NDGA/MapServer/", {
        "opacity": 0.6,
        "visible": false
        });
    tribalResLayer.setVisibleLayers([0]);
    legendLayers.push({layer:tribalResLayer,title:'Tribal Reservation Boundaries'});

	var cededTribalLayer = new esri.layers.ArcGISDynamicMapServiceLayer(servicesURL, {
        "opacity": 0.50,
        "visible": false
        });
    cededTribalLayer.setVisibleLayers([5]);
    legendLayers.push({layer:cededTribalLayer,title:'Ceded Tribal Boundaries'});

    var GLRINetLayer = new esri.layers.ArcGISDynamicMapServiceLayer(servicesURL, {
        "opacity": 0.40,
        "visible": false
        });
    GLRINetLayer.setVisibleLayers([2]);
    legendLayers.push({layer:GLRINetLayer,title:'USGS GLRI Nutrient Monitoring Basins'});

   var AOCLayer = new esri.layers.ArcGISDynamicMapServiceLayer(servicesURL, {
        "opacity": 0.35,
        "visible": false
        });
    AOCLayer.setVisibleLayers([1]);
    legendLayers.push({layer:AOCLayer,title:'EPA Areas of Concern'});

    var basinsLayer = new esri.layers.ArcGISDynamicMapServiceLayer(servicesURL, {
        "opacity": 0.35,
        "visible": true
        });
    basinsLayer.setVisibleLayers([3]);
    legendLayers.push({layer:basinsLayer,title:'Great Lakes Basins'});

    var sitesLayer = new esri.layers.ArcGISDynamicMapServiceLayer(servicesURL, {
        "opacity": 0.80,
        "visible": true,
        "useMapImage": true
        //"imageParameters": imageParameters
        });
    sitesLayer.setVisibleLayers([0]);
    sitesLayer.setDisableClientCaching(true);
    legendLayers.push({layer:sitesLayer,title:'SiGL Sites'});
	
	//IMPORTANT: This is where the layers are added to the map. Normally, this would be a simple list of variables. In this build, the layer variable names must be contained witin
	//an array bracket because the layer info has been placed inside the legendLayers array for the construction of a legend and toggle buttons.
	//IMPORTANT: Layers will be placed in ascending order from the order in this list. i.e., the first layer listed will be on bottom, the last layer listed will be on top.
	map.addLayers([cededTribalLayer, tribalResLayer, basinsLayer, GLRINetLayer, AOCLayer, sitesLayer]);

    //sitesLayer.setLayerDefinitions(whereClause);

	//this function fires after all layers have been added to map with the map.addLayers method above.
	//this function creates the legend element based on the legendLayers array which contains the relevant data for each layer. 
	dojo.connect(map,'onLayersAddResult',function(results){
		var legend = new esri.dijit.Legend({
			map:map,
			layerInfos:legendLayers
		},"legendDiv");
		legend.startup();
		
		//this forEach loop generates the checkbox toggles for each layer by looping through the legendLayers array (same way the legend element is generated). 
		dojo.forEach (legendLayers, function(layer){
			var layerName = layer.title;
			var checkBox = new dijit.form.CheckBox({
				name:"checkBox" + layer.layer.id,
				value:layer.layer.id,
				checked:layer.layer.visible,
				onChange:function(evt){
					var checkLayer = map.getLayer(this.value);
					checkLayer.setVisibility(!checkLayer.visible);
					this.checked = checkLayer.visible;						
				}
			});
			if (layer.zoomScale) {
				//create the holder for the checkbox and zoom icon
				var toggleDiv = dojo.doc.createElement("div");
				dojo.place(toggleDiv,dojo.byId("toggle"),"after");
				dojo.place(checkBox.domNode,toggleDiv,"first");
				var checkLabel = dojo.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
				var scale = layer.zoomScale;
				var zoomImage = dojo.doc.createElement("div");
				zoomImage.id = 'zoom' + layer.layer.id;
				zoomImage.innerHTML = '<img id="zoomImage" style="height: 18px;width: 18px" src="images/zoom.gif" />';
				dojo.connect(zoomImage, "click", function() {
					if (map.getScale() > scale) {
						map.setScale(scale);;
					}
				});
				dojo.place(zoomImage,toggleDiv,"last");
				dojo.setStyle(checkBox.domNode, "float", "left");
				dojo.setStyle(checkLabel, "float", "left");
				dojo.setStyle(toggleDiv, "paddingTop", "5px");
				dojo.setStyle(dojo.byId("zoomImage"), "paddingLeft", "10px");
				dojo.setStyle(toggleDiv, "height", "25px");
				//dojo.byId("toggle").appendChild(zoomImage);
				//dojo.appendChild(zoomImage.domNode,dojo.byId("toggle"),"after");
				
				dojo.place("<br/>",zoomImage,"after");
			} else {
				dojo.place(checkBox.domNode,dojo.byId("toggle"),"after");
				var checkLabel = dojo.create('label',{'for':checkBox.name,innerHTML:layerName},checkBox.domNode,"after");
				dojo.place("<br/>",checkLabel,"after");
			}
		});
	});
	
    //EXPERIMENATL WAY TO GET GRAPHICS TO DISPLAY ON CLICKED POINTS
    queryTask = new esri.tasks.QueryTask(servicesURL + "0");

    //initialize query
    query = new esri.tasks.Query();
    query.returnGeometry = true;
    query.outFields = ["SITE_ID"];



	//SEARCH LOGIC
	//calls function in SIGLSearch.js file 
	searchLogic();
	
	//OPTIONAL: the below remaining lines within the init function are for performing an identify task on a layer in the mapper. 
	// the following 7 lines establish an IdentifyParameters object(which is an argument for an identifyTask.execute method)and specifies the criteria used to identify features. 
	// the constructor of the identifyTask is especially important. the service URL there should match that of the layer from which you'd like to identify.
	identifyParams = new esri.tasks.IdentifyParameters();
    identifyParams.tolerance = 8;
    identifyParams.returnGeometry = true;
    identifyParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_VISIBLE;
    identifyParams.width  = map.width;
    identifyParams.height = map.height;
    identifyTask = new esri.tasks.IdentifyTask(servicesURL);

	//OPTIONAL: the following function carries out an identify task query on a layer and returns attributes for the feature in an info window according to the 
	//InfoTemplate defined below. It is also possible to set a default info window on the layer declaration which will automatically display all the attributes 
	//for the layer in the order they come from the table schema. This code below creates custom labels for each field and substitutes in the value using the notation ${[FIELD NAME]}. 
    function executeSiteIdentifyTask(evt) {
    	//Params that get cleared on each click event
        identifyParams.geometry = evt.mapPoint;
        identifyParams.mapExtent = map.extent;
        identifyParams.layerDefinitions = layerDefs; //make sure that filtered out points are not part of the identify.  grab the layerDefs on each click.
       
	    // the deferred variable is set to the parameters defined above and will be used later to build the contents of the infoWindow.
        var deferredResult = identifyTask.execute(identifyParams);  //sets up the request to the server, when called will identify features based on identify Params
        
        //variables that get reset on each click event
        var siteList = []; //create new variable to hold site ids  ALSO located here to clear variable for each onclick event.
        var projectList = []; // create new variable to hold project AND to clear array after each onclick event.
        var clickGeom = []; //create new variable to hold the click event geom ALSO placed here to clear the variable for every oncick event (used to display onclick graphic)  



        deferredResult.addCallback(function(response) {     
            // response is an array of identify result objects 
            map.graphics.clear();

            //controls popup display location based on click event coordinates
            var ymiddle = (map.extent.ymax - map.extent.ymin)/2 + (map.extent.ymin);
            var xmiddle = (map.extent.xmax - map.extent.xmin)/2 + (map.extent.xmin);

            //vertical position
            if (evt.mapPoint.y > ymiddle){
                screenPtY = evt.screenPoint.y - 300;
            } else{
                screenPtY = evt.screenPoint.y - 600;
            }

            //horizontal position
            if (evt.mapPoint.x > xmiddle){
                screenPtX = evt.screenPoint.x - 820;
            } else{
                screenPtX = evt.screenPoint.x + 10;
            }

            //stringify global variables for use in showSitePopup() when setting css display
            screenPtX.toString();
            screenPtY.toString();

            //loop through response objects
          	dojo.map(response, function(result){
                var projectNumber = result.feature.attributes.PROJECT_ID
            	var siteNumber = result.feature.attributes.SITE_ID; //get site_id
                var siteGeom = result.feature.geometry;
            
                siteList.push(siteNumber); //push site id into a list of site Ids.
                projectList.push(projectNumber);

                clickGeom.push(siteGeom);  //push geometries into an array so you can grab the first one only
                
                //FUTURE:  The following will display a graphic for every point within the click tolerance  map.graphics.add(result.feature.geometry, markerSymbol);
            });

            //display click grpahic based on the first item in the geometry array   
            //map.graphics.add(new esri.Graphic(clickGeom[0], markerSymbol));
            map.graphics.add(new esri.Graphic(new esri.geometry.Point([clickGeom[0].x,clickGeom[0].y], map.spatialReference), markerSymbol));
            showSitePopup(projectList, siteList);
        });//END DeferredResult.addCallback
    }//end executeSiteIdentifyTask method
	

	//Geocoder reference to geocoding services
    locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
	//calls the function that does the goeocoding logic (found in geocoder.js, an associated JS module)*
    dojo.connect(locator, "onAddressToLocationsComplete", showResults);
	
    //JQUERY FUNCTION NOT NEEDED HERE?  ALREADY IN APPLICATION ELSEWHERE?
    $(function () {

    ///BUILD ALL THE DROPDOWNS and DATEPICKERS
    $('.datepicker').datepicker({
        changeMonth:true,
        changeYear:true,
        yearRange: "-75:+1",
        showButtonPanel: true
        }).focus(function(){
            var thisCalendar = $(this);
            $('.ui-datepicker-calendar').detach();
            $('.ui-icon').detach();
            $('.ui-datepicker-close').click(function() {
                var month = $("#ui-datepicker-div .ui-datepicker-month :selected").val();
                var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
                thisCalendar.datepicker('setDate', new Date(year, month, 1));
            });
        });

    //BEGIN SITES TAB
    //Parameter Type (SITE)
    $("#parameterGroupSelector").multipleSelect({
        placeholder: "Choose parameters...",
        selectAll: false
    });

    //Parameter (SITE)
    /*$("#parameterSelector").multipleSelect({
        placeholder: "Choose parameters...",
        selectAll: false
    });*/

    //Resource (SITE)
    $("#resourceComponentSelector").multipleSelect({
        placeholder: "Choose resource...",
        selectAll: false
    });

    //Duration (SITE)
    $("#durationSelector").multipleSelect({
        placeholder: "Choose project duration...",
        selectAll: false
    });

    //Status (SITE)
    $("#statusSelector").multipleSelect({
        placeholder: "Choose project status...",
        selectAll: false
    });

    //Media (SITE)
    $("#mediaSelector").multipleSelect({
        placeholder: "Choose media...",
        selectAll: false
    });

    //Great lake (SITE)
    $("#lakeSelector").multipleSelect({
        placeholder: "Choose lake...",
        selectAll: false
    });

    //State (SITE)
    $("#stateSelector").multipleSelect({
        placeholder: "Choose state...",
        selectAll: false
    });

    //BEGIN MULTIPLE SELECTS FOR PROJECTS TAB
    //Project (PROJECT) 
    $("#projectSelector").multipleSelect({
        single: true,
        placeholder:"Select Individual Project...",
        selectAll: false
    });

    //Organization (PROJECT) 
    $("#organizationSelector").multipleSelect({
        single: true,
        placeholder:"Choose a project...",
        selectAll: false
    });

    //Objective (PROJECT)
    $("#objectiveSelector").multipleSelect({
        placeholder: "Choose objective...",
        selectAll: false
    });

    //PROJECT DURATION (PROJECT)
    $("#projectDurationSelector").multipleSelect({
        placeholder: "Choose project duration...",
        selectAll: false
    });

    //PROJECT STATUS (PROJECT)
    $("#projectStatusSelector").multipleSelect({
        placeholder: "Choose project status...",
        selectAll: false
    });

    //Great Lake (PROJECT)
    $("#projectLakeSelector").multipleSelect({
        placeholder: "Choose lake...",
        selectAll: false
    });

    //State (PROJECT)
    $("#projectStateSelector").multipleSelect({
        placeholder: "Choose state/Province...",
        selectAll: false
    });
    //END BUILD MULTIPLESELECT DROPDOWNS and DATEPICKERS

    //set up click event for help info button
    $("#helpIcon").click(function(){
    	$("#helpDialog").dialog({
    		dialogClass: 'helpDialog',
    		resizable: false
    	});
    });

    //called each time a user closes a dropdown
    //if any of the dropdowns are checked on button click, the selected parameter names/ids are passed to an AJAX call to return the matching SITE_IDs
    function filterSites() { 

        //grab a value for every selected dropdown
        //Parameter Type
        var parameterGrpArray = $("#parameterGroupSelector").multipleSelect('getSelects');
        if(parameterGrpArray.length > 0){
           var stringParaGrps = GetStringVersion(parameterGrpArray); 
        } else {
            var stringParaGrps = "";
        }
        
        //Parameter
        /*var parameterArray = $("#parameterSelector").multipleSelect('getSelects');
        if (parameterArray.length >0){
            var stringParams = GetStringVersion(parameterArray);
        } else {
            var stringParams = "";
        }*/

        //From Date
        //var fromDateString = $("#siteFromDate").val();
        var fromDateString = "";

        //To Date
        //var toDateString = $("#siteToDate").val();
        var toDateString = "";

        //Resource Component
        var resourceArray = $("#resourceComponentSelector").multipleSelect('getSelects');
        if(resourceArray.length > 0 ){
            var stringResource = GetStringVersion(resourceArray);
        } else {
            var stringResource = "";
        }

        //Duration  NEW MUST ADD TO QUERYSTRING BELOW
        var durationArray = $("#durationSelector").multipleSelect('getSelects');
        if(durationArray.length > 0 ){
            var stringDuration = GetStringVersion(durationArray);
        } else {
            var stringDuration = "";
        }

        //Duration  NEW MUST ADD TO QUERYSTRING BELOW
        var statusArray = $("#statusSelector").multipleSelect('getSelects');
        if(statusArray.length > 0 ){
            var stringStatus = GetStringVersion(statusArray);
        } else {
            var stringStatus = "";
        }
        
        //Media
        var mediaArray = $("#mediaSelector").multipleSelect('getSelects');
        if(mediaArray.length > 0){
            var stringMedia = GetStringVersion(mediaArray);
        } else {
            var stringMedia = "";
        }

        //Great Lake
        var lakeArray = $("#lakeSelector").multipleSelect('getSelects');
        if(lakeArray.length > 0 || oldLakeArray == undefined ){
            lakeDiffCheck = $(lakeArray).not(oldLakeArray).length == 0 && $(oldLakeArray).not(lakeArray).length == 0;
            if(lakeDiffCheck != true){
                var stringLake = GetStringVersion(lakeArray);
                oldLakeArray = lakeArray;
            } else{
                 var stringLake = "";
            }
        } else {
            var stringLake = "";
            oldLakeArray = [];
        }

        var stateArray = $("#stateSelector").multipleSelect('getSelects');
        if (stateArray.length > 0 || oldStateArray == undefined){
            //diff check returns true if the same values are within, even if they are out of order
            stateDiffCheck = $(stateArray).not(oldStateArray).length == 0 && $(oldStateArray).not(stateArray).length == 0;
            //if the old and new arrays are different, go on to make the call, if not, exit function
            if (stateDiffCheck != true){
                var stringState = GetStringVersion(stateArray);
                oldStateArray = stateArray;
            } 
            else{
                var stringState = "";
            }
        } else {
            var stringState = "";
            oldStateArray = [];
        }
        
        //start up the refresh screen (it will end on map update so no need to end in this function)
        dojo.style('refreshScreen', 'visibility', 'visible');

        //TODO  INSERT PROJECTS TAB FUCTIONALITY HERE

        //PROJECTS TAB WILL NEED TO WAIT FOR NOW
       /* var projLakeArr = $('#projectLakeSelector').multipleSelect('getSelects');
        var stringProjLake = GetStringVersion(projLakeArr);*/

         //..etc through all the dropdowns

        //call the endpoint
        //function callSitesEndpoint (stringParaGrps, stringParams, stringResource, stringMedia, stringLake, stringState){
            
        //build the endpoint query using the variables set above
        //old way using 1 dropdown for ParamType and 1 dropdown for Params
        //var queryString  = "sites?ParamType=" + stringParaGrps + "&Parameters=" + stringParams + "&FromDate=" + fromDateString + "&ToDate=" + toDateString + "&ResComp=" + stringResource + "&Media=" + stringMedia + "&Lake="+ lakeArray +"&State="+ stateArray;
        
        //new way using single grouped parameter dropdown
        var queryString  = "sites?Parameters=" + stringParaGrps + "&FromDate=" + fromDateString + "&ToDate=" + toDateString + "&Duration=" + stringDuration + "&Status=" + stringStatus + "&ResComp=" + stringResource + "&Media=" + stringMedia + "&Lake="+ lakeArray +"&State="+ stateArray;

        $.ajax({
            dataType: 'json',
            type: 'Post',
            url: endpointRoot + queryString,
            headers:{
                Accept: 'application/json',
                Host: 'sigl.wim.usgs.gov'
            },
            //build a string to be used as a layer definition
            success: function(data){
                $('#resultsText').text('Displaying ' + data.length + ' matching sites').css("padding", "10px");
                console.log('Returning ' + data.length + ' matching sites');
                //if no sites fit the selected criteria, give a failure dialog -- declared in HTML
                if (data.length == 0){
                    $( "#dialog" ).dialog({
                        modal:true,
                        buttons: {
                            Ok: function() {
                                $(this).dialog("close");
                            }
                        }
                    });
                    //$("#dialog").css({visibility:'block'});
                    dojo.style('refreshScreen', 'visibility', 'hidden');
                } else {
                    layerDefinitionString = "SITE_ID in (";
                    var i = 0;
                    
                    for (i==0; i<data.length; i++){
                        if (i < data.length-1) {
                            layerDefinitionString += data[i].SITE_ID +",";
                            //siteIdArray.push("SITE_ID = " + "'" + data[i].SITE_ID + "'");
                        } else {
                            layerDefinitionString += data[i].SITE_ID + ")";
							//siteIdArray.push("SITE_ID = " + "'" + data[i].SITE_ID + "'");
                        }

                    }
                    
                    //remove trailing comma and whitespace
                    //var tempString = layerDefinitionString.slice(0,-4);
                    layerDefs=[];
                    layerDefs[0] = layerDefinitionString;
                  
                    //set layer defs and don't refresh yet.
                    sitesLayer.setLayerDefinitions(layerDefs, true); 
                    //sitesLayer.layerDefinitions = layerDefs;
                    //sitesLayer.refresh();
                    sitesLayer.refresh();

                    //$('results').val('');


                }//end else
            }//end Success
        });//end AJAX endpoint call

    }// filterSites() function

    function getProjectSites(){

        var projOrgArray = $("#organizationSelector").multipleSelect('getSelects');
        if(projOrgArray.length > 0){
           var stringProjOrg = GetStringVersion(projOrgArray); 
        } else {
            var stringProjOrg = "";
        }

        var projObjArray = $("#objectiveSelector").multipleSelect('getSelects');
        if(projObjArray.length > 0){
           var stringProjObj = GetStringVersion(projObjArray); 
        } else {
            var stringProjObj = "";
        }

        //NEW NEED TO INSERT INTO QUERYSTRING BELOW
        var projDurationArray = $("#projectDurationSelector").multipleSelect('getSelects');
        if(projDurationArray.length > 0){
           var stringProjDuration = GetStringVersion(projDurationArray); 
        } else {
            var stringProjDuration = "";
        }

        //NEW NEED TO INSERT INTO QUERYSTRING BELOW
        var projStatusArray = $("#projectStatusSelector").multipleSelect('getSelects');
        if(projStatusArray.length > 0){
           var stringProjStatus = GetStringVersion(projStatusArray); 
        } else {
            var stringProjStatus = "";
        }
		
		//date picker is removed so add in an empty string to query
        //var stringStartDate = $("#projectFromDate").val();
        var stringStartDate = "";

        //var stringEndDate = $("#projectToDate").val();
        var stringEndDate = "";

        var projLakeArray = $("#projectLakeSelector").multipleSelect('getSelects');
        if(projLakeArray.length > 0){
           var stringProjLake = GetStringVersion(projLakeArray); 
        } else {
            var stringProjLake = "";
        }

        var projStateArray = $("#projectStateSelector").multipleSelect('getSelects');
        if(projStateArray.length > 0){
           var stringProjState = GetStringVersion(projStateArray); 
        } else {
            var stringProjState = "";
        }

        dojo.style('refreshScreen', 'visibility', 'visible');

        var queryString  = "sites/ProjectSites?" + "ProjOrg=" + stringProjOrg + "&ProjObjs=" + stringProjObj + "&Duration=" + stringProjDuration + "&Status=" + stringProjStatus + "&StartDate=" + stringStartDate + "&EndDate=" + stringEndDate + "&Lake=" + stringProjLake + "&State=" + stringProjState ;

        $.ajax({
            dataType: 'json',
            type: 'Post',
            url: endpointRoot + queryString,
            headers:{
                Accept: 'application/json',
                Host: 'sigl.wim.usgs.gov'
            },
            //build a string to be used as a layer definition
            success: function(data){
                //dojo.style('refreshScreen', 'visibility', 'visible');
                $('#resultsText').text('Displaying ' + data.length + ' matching sites').css('padding', '10px');
                console.log('returning ' + data.length + ' matching sites');
                //alert user if nothing comes back
                if (data.length == 0){
                    //alert('No sites fit the selected criteria');
                    $( "#dialog" ).dialog({
                        modal:true,
                        buttons: {
                            Ok: function() {
                                $(this).dialog("close");
                            }
                        }
                    });
                    dojo.style('refreshScreen', 'visibility', 'hidden');
                } else {
                	//create the feature service query SITE_ID in (123,123)
                    layerDefinitionString = "SITE_ID in (";
                    var i = 0;
               		
                    for (i==0; i<data.length; i++){
                        if (i < data.length-1) {
                            layerDefinitionString += data[i].SITE_ID +",";
                        } else {
                            layerDefinitionString += data[i].SITE_ID + ")";
                        }

                    }
                    layerDefs=[];
                    layerDefs[0] = layerDefinitionString;
                    //set layer defs and don't refresh yet.
                    sitesLayer.setLayerDefinitions(layerDefs, true); 
                    sitesLayer.refresh();
                }//end else
            }//end Success
        });//end AJAX endpoint call

    }// END getProjectSites()
 
    function GetStringVersion(someArray) {
        var itemString;
        $.each(someArray, function(name, value){
            if(itemString == undefined){
                console.log(name + "," + value);
                itemString = value; //get and pass along all values
            } else {
                itemString += "," + value;
            }
        });
        itemString.slice(0,-1);

        console.log(itemString);
        return itemString;
    } //END getStringVersion() funtion

        //following two onclick functions need to be in the INIT() function in order to use #sitesLayer
        //INDIVIDUAL PROJECT SEARCH
        $("#projectNameSubmitButton").click(function(){
            selection = $("#projectSelector").multipleSelect('getSelects');
            if (selection.length > 0 ){

                dojo.style('refreshScreen', 'visibility', 'visible');
                var stringSelection = selection[0];
                var siteList = [];
                sitesLayer.setDefaultLayerDefinitions();
                layerDefinitionString = "";
                //siteIdArray = []; //clear layer defs
                layerDefinitionString += "PROJECT_ID = " + stringSelection;
                //siteIdArray.push("PROJECT_ID " + stringSelection); //add selection to layer Defs
                layerDefs[0] = layerDefinitionString;

                sitesLayer.setLayerDefinitions(layerDefs);

                showProjectPopup(selection);

                //clear dropdown selections in the project sites search
                $("#projectSelector").multipleSelect('uncheckAll');
            	$("#projectDurationSelector").multipleSelect('uncheckAll');
	            $("#projectStatusSelector").multipleSelect('uncheckAll');
	            
	            //$("#projectFromDate").val("");
	            //$("#projectToDate").val("");
	            
	            $("#organizationSelector").multipleSelect('uncheckAll');
	            $("#objectiveSelector").multipleSelect('uncheckAll');
	            $("#projectLakeSelector").multipleSelect('uncheckAll');
	            $("#projectStateSelector").multipleSelect('uncheckAll');
            }

        });

        //PROJECT PARAMETERS SEARCH
        $("#projectSubmitButton").click(function(){
            if ($("#projectSelector").multipleSelect('getSelects') > 0){
                $("#projectSelector").multipleSelect('uncheckAll');
            }

            getProjectSites();
        });

        $("#siteSubmitButton").click(function(){
            filterSites();
        })

        $("#siteclearButton").click(function(){
            layerDefs[0] = "";
            //siteIdArray = [];
            sitesLayer.setDefaultLayerDefinitions();

			$('#resultsText').text('').css("padding", "");

            $("#parameterGroupSelector").multipleSelect('uncheckAll');
            $("#parameterSelector").multipleSelect('uncheckAll');
            $("#durationSelector").multipleSelect('uncheckAll');
            $("#statusSelector").multipleSelect('uncheckAll');
            $("#siteFromDate").val("");
            $("#siteToDate").val("");
            $("#resourceComponentSelector").multipleSelect('uncheckAll');
            $("#mediaSelector").multipleSelect('uncheckAll');
            $("#lakeSelector").multipleSelect('uncheckAll');
            $("#stateSelector").multipleSelect('uncheckAll');
        });

        $("#projectClearButton").click(function(){
            layerDefs[0] = "";
           // siteIdArray = [];
            sitesLayer.setDefaultLayerDefinitions();

            $('#resultsText').text('').css("padding", "");

            $("#projectSelector").multipleSelect('uncheckAll');
            $("#projectDurationSelector").multipleSelect('uncheckAll');
            $("#projectStatusSelector").multipleSelect('uncheckAll');
            
            $("#projectFromDate").val("");
            $("#projectToDate").val("");
            
            $("#organizationSelector").multipleSelect('uncheckAll');
            $("#objectiveSelector").multipleSelect('uncheckAll');
            $("#projectLakeSelector").multipleSelect('uncheckAll');
            $("#projectStateSelector").multipleSelect('uncheckAll');
        });   

    //TURNED OFF TESTING WHETHER IT'S NEEDED OR NOT
    });//end Jquery

}
//END of init function	

//mapReady function that fires when the first or base layer has been successfully added to the map. Very useful in many situations. called above by this line: dojo.connect(map, "onLoad", mapReady)
function mapReady(map){ 

    //searchLogic();	
	//Sets the globe button on the extent nav tool to reset extent to the initial extent.
	dijit.byId("extentSelector").set("initExtent", map.extent);  
	
	//Create scale bar programmatically because there are some event listeners that can't be set until the map is created.
	//Just uses a simple div with id "latLngScaleBar" to contain it
	//var latLngBar = new wim.LatLngScale({map: map}, 'latLngScaleBar');	
	
	dojo.style('loadingScreen', 'opacity', '0.75');
	var loadingUpdate = dojo.connect(map,"onUpdateStart",function(){
		dojo.style('loadingScreen', 'visibility', 'visible');
	});
	
	dojo.connect(map,"onUpdateEnd",function(){
		//commented out because of DropDown loading-- look at AllDone()
		//dojo.style('loadingScreen', 'visibility', 'hidden');
		dojo.disconnect(loadingUpdate);
	
		dojo.connect(map, "onUpdateStart",function(){
			dojo.style('refreshScreen', 'visibility', 'visible');
		});
		
		dojo.connect(map, "onUpdateEnd", function(){
			dojo.style('refreshScreen', 'visibility', 'hidden');
		});
	
	});
}

// USGS Logo click handler function
function showUSGSLinks(evt){
	//check to see if there is already an existing linksDiv so that it is not build additional linksDiv. Unlikely to occur since the usgsLinks div is being destroyed on mouseleave.
	if (!dojo.byId('usgsLinks')){
		//create linksDiv
		var linksDiv = dojo.doc.createElement("div");
		linksDiv.id = 'usgsLinks';
		//LINKS BOX HEADER TITLE HERE
		linksDiv.innerHTML = '<div class="usgsLinksHeader"><b>USGS Links</b></div>';
		//USGS LINKS GO HERE
		linksDiv.innerHTML += '<p>';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/">USGS Home</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/ask/">Contact USGS</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://search.usgs.gov/">Search USGS</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/accessibility.html">Accessibility</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/foia/">FOIA</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/privacy.html">Privacy</a><br />';
		linksDiv.innerHTML += '<a style="color:white" target="_blank" href="http://www.usgs.gov/laws/policies_notices.html">Policies and Notices</a></p>';
		
		//place the new div at the click point minus 5px so the mouse cursor is within the div
		linksDiv.style.top =  evt.clientY-5 + 'px';
		linksDiv.style.left = evt.clientX-5 + 'px';
		
		//add the div to the document
		dojo.byId('map').appendChild(linksDiv);
		//on mouse leave, call the removeLinks function
		dojo.connect(dojo.byId("usgsLinks"), "onmouseleave", removeLinks);

	}
}

//remove (destroy) the usgs Links div (called on mouseleave event)
function removeLinks(){
	dojo.destroy('usgsLinks');
}

//function to hide the loading div
/*function AllDone() {
   dojo.style('loadingScreen', 'visibility', 'hidden');
}*/

//TODO
function GroupSelectorChange(){
	console.log('groupselectorChangeFunction');
	//get selected values from GroupSelector Dropdown
	//make new esri request
	//populate parameter select dropdown
	
}

//show site popup
function showSitePopup(projectList, siteList){

     $("#titleSiteName").empty();
	//console.log("projects returned: " + projectList);
    var projectID = projectList[0];

   
    var siteId = siteList[0];
    fillPopupFields(siteId);
    


	//Request site info from DB REST endpoint
	if (projectID.length > 0){
		$.ajax({
			dataType: "json",
			type: "Get",
			url: endpointRoot + "Sites/ProjectSitesInfo?ProjectId=" + projectID,
			headers:{
				Accept: "application/json",
				Host: "sigl.wim.usgs.gov"
			},
			success: function(data){

                $("#projectLeftPanel").empty();
                $.each(data, function(index){
                    var textValue = data[index].Name;
                    var idValue = data[index].SiteId;
                    $('<div/>', {
                        'class':'dataLabel projectListItem',
                        'style' : 'display: block; cursor: pointer',
                        'text': textValue,
                        'id': idValue,
                    }).appendTo("#projectLeftPanel");
                });

                if(siteList.length > 0){
                    //apply .active to the site that was clicked
                    $('#' + siteId).addClass('active');
                } else{
                    siteId = "";
                    fillPopupFields(siteId);
                }
                
                
                //assign onclick function to all dynamically created <a/> tags
			     $(".projectListItem").click(function() {
                    //remove .active from former and add to current
                    $('.projectListItem').removeClass('active');
                    $(this).addClass('active');
                    //get the siteId from the id of the link element
                    var siteId = this.id;
                    console.log('siteID = ' + siteId);
                    //passes site ID to an esri query which will identify the selected point and add a highlight graphic.
                    //var testPattern = 'SITE_ID = ' + siteId;
                    
                    executeQueryTask(siteId);

                    
                    fillPopupFields(siteId);
                });


            }

		});
	}

	
	if(document.getElementById("sitePopupWrapper").style.display != 'block' || document.getElementById('sitePopupWrapper').style.display == 'hidden'){

        tabIndex=3;

        //first time popup is opened
		if(document.getElementById("sitePopupWrapper").innerHTML == ""){
			$("#sitePopupWrapper").load('SitePopup/SitePopup.html', function(){
                $("#siteTabbedContainer").tabs("option", "active", tabIndex);
            });
            

            $('#loading').css({display:'table'});
            //$('#loadingT1').css({display:'table'});
			
            $('#sitePopupWrapper').css({
                    display:'block',
                    position: 'absolute',
                    top: screenPtY + "px",
                    left: screenPtX + "px"
                });
            
        //subsequent popup openings
		} else {
            //$('#loading').style('display', 'table', 'important');
            $('#loading').css({display:'table'});
            //$('#loadingT1').css({display:'table'});
            $("#sitePopupWrapper").css({top: "", left: ""});
			$('#sitePopupWrapper').css({display:'block',
                    position: 'absolute',
                    top: screenPtY + "px",
                    left: screenPtX + "px"
                });
            
            $("#siteTabbedContainer").tabs("option", "active", tabIndex);

		}
	} else {
        //popup is open and user has clicked a new site
        //close the popup, but do not remove the graphic.
        $('#sitePopupWrapper').css({display:'none'});

        //$('#loading').style('display', 'table', 'important');
        $('#loading').css({display:'table'});
        //$('#loadingT1').css({display:'table'});
        $("#sitePopupWrapper").css({top: "", left: ""});
        $('#sitePopupWrapper').css({display:'block',
                position: 'absolute',
                top: screenPtY + "px",
                left: screenPtX + "px"
            });
        
    }	

    $(document).ajaxStop(function(){
        //$('#loading').fadeOut('slow');
        $('#loading').css({display:'none'});
        $('#loadingT1').fadeOut('slow');
        //TRYING TO SCROLL TO THE ACTIVE ELEMENT
        //$('#projectLeftPanel').scrollTo('.active');
    });		
}

function fillPopupFields(siteId){

    //$('.projectLeftPanel').animate({scrollTop: ".active");

    //adds a color to the selected .projectListItem <div/>.  Color will will remain set until popup is re-instantiated to indicate 'visited' links
    $('#' + siteId).css({color:'#59595C'});


    $.ajax({
        dataType: "json",
        type: "Get",
        url: endpointRoot + "Sites/SiteInformation?siteId=" + siteId,
        headers:{
            Accept: "application/json",
            Host: "sigl.wim.usgs.gov"
        },
        global:false,
        success: function(data){
        		//NEVER use an check here, project name is needed right away for the popup title.
        		$("#titleSiteName").html(data.aProject.NAME);


                //tab1 PROJECT SITES
                if(data.Name){
                	$("#siteNameValue").html(data.Name);
                } else{
                	$("#siteNameValue").html("N/A");
                }
                if(data.latitude){
                	$("#locationValue").html(data.latitude + ", " + data.longitude);
                } else{
                	$("#locationValue").html("N/A");
                }
                if(data.State){
                	$("#stateValue").html(data.State);
                } else{
                	$("#stateValue").html("N/A");
                }
                if(data.Country){
                	$("#CountryValue").html(data.Country);
                } else{
                	$("#CountryValue").html("N/A");
                }
                if (data.GreatLake){
                	$("#GreatLakeValue").html(data.GreatLake);
                } else{
                	$("#GreatLakeValue").html("N/A");
                }
                if(data.Waterbody){
                	$("#waterbodyValue").html(data.Waterbody);
                } else{
                	$("#waterbodyValue").html("N/A");
                }
                if(data.WatershedHUC8){
                	$("#watershedValue").html(data.WatershedHUC8);
                } else{
                	$("#watershedValue").html("N/A");
                }
                if (data.Description){
                	$("#siteDescriptionValue").html(data.Description);
                } else{
                	$("#siteDescriptionValue").html("N/A");
                }
                if(data.StartDate){
                	$("#siteStartDateValue").html(data.StartDate);
                } else{
                	$("#siteStartDateValue").html("N/A");
                }
                if (data.EndDate){
                	$("#siteEndDateValue").html(data.EndDate);
                } else{
                	$("#siteEndDateValue").html("N/A");
                }
                if(data.Status){
                	$("#statusValue").html(data.Status);
                } else{
                	$("#statusValue").html("N/A");
                }
                if (data.Resources){
                	$("#resourceComponentValue").html(data.Resources);
                } else{
                	$("#resourceComponentValue").html("N/A");
                }
                if (data.Media){
                	$("#mediaValue").html(data.Media);
                } else{
                	$("#mediaValue").html("N/A");
                }
                if (data.Frequency){
                	$("#samplingFrequencyValue").html(data.Frequency); 
                } else{
                	$("#samplingFrequencyValue").html("N/A"); 
                }
                if (data.SamplePlatform){
                	$("#samplingPlatformValue").html(data.SamplePlatform);
                } else{
                	$("#samplingPlatformValue").html("N/A");
                }
                if(data.AdditionalInfo){
                	$("#additionalSiteInfoValue").html(data.AdditionalInfo);
                } else{
                	$("#additionalSiteInfoValue").html("N/A");
                }

                if (data.URL){
                	var siteUrl = data.URL;
                	$("#siteWebsiteWrapper").empty();
		    		$("<a/>",{
		            	'href': siteUrl,
		            	'class': 'dataValue',
		            	'text': siteUrl,
		            	'target': "_blank"
		        	}).appendTo("#siteWebsiteWrapper");

                } else{
                	$("#siteWebsiteWrapper").empty();
			    	$('<span/>', {
			    		'class': 'dataValue',
			    		'text': 'N/A'
			    	}).appendTo("#siteWebsiteWrapper").after("</br>");
                }

                
                //tab1 SUBTAB 2
                if(data.Parameters){
                    if (data.Parameters.Biological.length > 0){
                        $("#bioWrapper").empty();
                        $('<div/>', {
                            'class': 'contentPaneHeaders',
                            'text': 'BIOLOGICAL'
                        }).appendTo("#bioWrapper");
                        $.each(data.Parameters.Biological, function(index){
                            $('<div/>', {
                                'class':'dataLabel indent',
                                'text': data.Parameters.Biological[index].PARAMETER
                            }).appendTo("#bioWrapper");
                        });
                    } else {
                    	$("#bioWrapper").empty();
                    }

                    if (data.Parameters.Chemical.length > 0){
                        $("#chemWrapper").empty();
                        $('<div/>', {
                            'class': 'contentPaneHeaders',
                            'text': 'CHEMICAL'
                        }).appendTo("#chemWrapper");

                        $.each(data.Parameters.Chemical, function(index){
                            $('<div/>', {
                                'class':'dataLabel indent',
                                'text': data.Parameters.Chemical[index].PARAMETER
                            }).appendTo("#chemWrapper");
                        });
                    } else{
                    	$("#chemWrapper").empty();
                    }

                    if (data.Parameters.Microbiological.length > 0){
                        $("#microbioWrapper").empty();
                        $('<div/>', {
                            'class': 'contentPaneHeaders',
                            'text': 'MICROBIOLOGICAL'
                        }).appendTo("#microbioWrapper");

                        $.each(data.Parameters.Microbiological, function(index){
                            $('<div/>', {
                                'class':'dataLabel indent',
                                'text': data.Parameters.Microbiological[index].PARAMETER
                            }).appendTo("#microbioWrapper");
                        });
                    } else{
                    	$("#microbioWrapper").empty();
                    }

                    if (data.Parameters.Physical.length > 0){
                        $("#physWrapper").empty();
                        $('<div/>', {
                            'class': 'contentPaneHeaders',
                            'text': 'PHYSICAL'
                        }).appendTo("#physWrapper");
                        $.each(data.Parameters.Physical, function(index){
                            $('<div/>', {
                                'class':'dataLabel indent',
                                'text': data.Parameters.Physical[index].PARAMETER
                            }).appendTo("#physWrapper");
                        });
                    } else{
                    	$("#physWrapper").empty();
                    }

                    if (data.Parameters.Toxicological.length > 0){
                        $("#toxicWrapper").empty();
                        $('<div/>', {
                            'class': 'contentPaneHeaders',
                            'text': 'TOXICOLOGICAL'
                        }).appendTo("#toxicWrapper");
                        $.each(data.Parameters.Toxicological, function(index){
                            $('<div/>', {
                                'class':'dataLabel indent',
                                'text': data.Parameters.Toxicological[index].PARAMETER
                            }).appendTo("#toxicWrapper");
                        });
                    } else{
                    	$("#toxicWrapper").empty();
                    }
                }

                //tab2 PROJECT SUMMARY
                $("#ProjectName").html("Project Name: " + data.aProject.NAME);

                //populate Orgs
                if(data.ProjOrgs.length > 0){
                    //reset
                    $('#orgs').empty();
                    var orgValues = "";

                    //loop through projOrgs
                    $.each(data.ProjOrgs, function(index){
                        var tempText = ""
                        if (data.ProjOrgs[index].NAME != undefined || data.ProjOrgs[index].NAME != null){
                            tempText = data.ProjOrgs[index].NAME;
                        }
                        if(data.ProjOrgs[index].DIVISION != undefined || data.ProjOrgs[index].DIVISION != null ){
                            tempText += ", " + data.ProjOrgs[index].DIVISION;
                        }

                        if ( data.ProjOrgs[index].SECTION != undefined || data.ProjOrgs[index].SECTION != null ){
                            tempText += ", " + data.ProjOrgs[index].SECTION;
                        } 
                        
                        //compile the final string
                        orgValues += tempText + "; "

                    });

                    //add the org text and assign class to the div
                    $("#orgs").html(orgValues + "<br/>");
                    $("#orgs").addClass("dataValue");
                } else{
                	$('#orgs').empty();
                }

			    //multiple project urls are comma separated, get them as an array
			    if (data.aProject.URL != null || data.aProject.URL != undefined){
			    	var projectUrl = data.aProject.URL.split("|");
			    	$("#projectWebsiteWrapper").empty();

			    	$.each(projectUrl, function(index){
			    		var urlString = projectUrl[index];
			    		$("<a/>",{
			            	'href': urlString,
			            	'class': 'dataValue',
			            	'text': urlString,
			            	'target': "_blank"
			        	}).appendTo("#projectWebsiteWrapper").after("; ");
			    	});
			    } else{
			    	//if the url field is blank, clear any previous entry and insert an N/A span
			    	$("#projectWebsiteWrapper").empty();
			    	$('<span/>', {
			    		'class': 'dataValue',
			    		'text': 'N/A'
			    	}).appendTo("#projectWebsiteWrapper").after("</br>");
			    }

			    ///TEST TO FIND THE DATA OBJECT
			    if (data.aProject.PROJ_STATUS_ID != null || PROJ_STATUS_ID != undefined){
			    	if (data.aProject.PROJ_STATUS_ID == 1){
			    		$("#projectStatusValue").html("Active - completion date undetermined");
			    	}
			    	if (data.aProject.PROJ_STATUS_ID == 2){
			    		$("#projectStatusValue").html("Active - with expected completion date");
			    	}
			    	else if (data.aProject.PROJ_STATUS_ID == 3){
			    		$("#projectStatusValue").html("Completed");
			    	}
			    	
			    } else {
			    	$("#projectStatusValue").html("N/A");
			    }

                if (data.aProject.START_DATE != null || data.aProject.START_DATE != undefined){
                    var splitString = data.aProject.START_DATE.split("-");
                    var removeTime = splitString[2].slice(0,-9);
                    var formattedDate = splitString[1] + "/" + removeTime + "/" + splitString[0];
                    $("#projectStartDateValue").html(formattedDate);
                } else {
                	$("#projectStartDateValue").html('N/A');
                }
                
                if (data.aProject.END_DATE != null || data.aProject.END_DATE != undefined ){
                    var splitString = data.aProject.END_DATE.split("-");
                    var removeTime = splitString[2].slice(0,-9);
                    var formattedDate = splitString[1] + "/" + removeTime + "/" + splitString[0];
                    $("#projectEndDateValue").html(formattedDate);
                } else{
                	$("#projectEndDateValue").html('N/A');
                }

                if (data.ProjectObjectives){
                	$("#projectObjectiveValue").html(data.ProjectObjectives);
                } else{
                	$("#projectObjectiveValue").html("N/A");
                }
                

                if (data.aProject.PROJ_DURATION_ID != null || data.aProject.PROJ_DURATION_ID != undefined){
					if (data.aProject.PROJ_DURATION_ID == 1){
						$("#projectDurationValue").html("Long term (greater than 5 years)");
					}
					if (data.aProject.PROJ_DURATION_ID == 2){
						$("#projectDurationValue").html("Short term (2 to 5 years)");
					}
					else if (data.aProject.PROJ_DURATION_ID == 3){
						$("#projectDurationValue").html("Single effort (1 year or less)");
					}
				} else {
					$("#projectDurationValue").html("N/A");
				}
                //TODO figure out new object syntax for aproject
                if (data.aProject.DESCRIPTION){
                	$("#projectDescriptionValue").html(data.aProject.DESCRIPTION);
                } else{
                	$("#projectDescriptionValue").html("N/A");
                }
                if (data.ProjectKeywords){
                	$("#projectKeywordsValue").html(data.ProjectKeywords);
                } else{
                	$("#projectKeywordsValue").html("N/A");
                }
                if (data.aProject.ADDITIONAL_INFO){
                	$("#additionalProjectInfoValue").html(data.aProject.ADDITIONAL_INFO);
                } else{
                	$("#additionalProjectInfoValue").html("N/A");
                }
              

                //dynamically build project data list
			    //clear whatever is in there first
			    $("#projectDataWrapper").empty();
				$.each(data.ProjectData, function(index){
					 //add DMS
					if (data.ProjectData[index].DESCRIPTION != null){
						$('<span/>', {
				            'class':'dataLabel',
				            'text': 'DATA MANAGEMENT SYSTEM: '
				        }).appendTo('#projectDataWrapper');
				        $('<span/>',{
				            'class': 'dataValue',
				            'text' : data.ProjectData[index].DESCRIPTION
				        }).appendTo('#projectDataWrapper').after("<br/>");
					}

			        //add data hosting location
			        if(data.ProjectData[index].HOST_NAME != null){
				       	$('<span/>', {
				            'class':'dataLabel',
				            'text': 'DATA HOSTING ENTITY: '
				        }).appendTo('#projectDataWrapper');
				        $('<span/>',{
				            'class': 'dataValue',
				            'text' : data.ProjectData[index].HOST_NAME
				        }).appendTo('#projectDataWrapper').after("<br/>");
			        }
			       	
			        //add online data location
			        if (data.ProjectData[index].PORTAL_URL != null){
				        $('<span/>', {
				            'class':'dataLabel',
				            'text': 'ONLINE DATA LOCATION (IF AVAILABLE): '
				        }).appendTo('#projectDataWrapper');
				        $('<a/>',{
				            'class': 'dataValue',
				            'href': data.ProjectData[index].PORTAL_URL,
				            'text' : data.ProjectData[index].PORTAL_URL,
				            'target': '_blank'
				        }).appendTo('#projectDataWrapper').after("<br/>","<br/>");
			        }

				});

                

                //dynamically build project pubs list  USE #pubsWrapper element as container
                //clear whatever is in there first
                $("#pubsWrapper").empty();
                $.each(data.ProjectPubs, function(index){
                    //add TITLE
                    $('<span/>', {
                        'class':'dataLabel',
                        'text': 'PUBLICATION TITLE: '
                    }).appendTo('#pubsWrapper');
                    $('<span/>',{
                        'class': 'dataValue',

                        'text' : data.ProjectPubs[index].TITLE
                    }).appendTo('#pubsWrapper').after("<br/>");

                    //add pub DESCRIPTION, but only if there is something in the field
                    if (data.ProjectPubs[index].DESCRIPTION != null){
                        $('<span/>', {
                            'class':'dataLabel',
                            'text': 'PUBLICATION DESCRIPTION: '
                        }).appendTo('#pubsWrapper');
                        $('<span/>',{
                            'class': 'dataValue',
                            'text' : data.ProjectPubs[index].DESCRIPTION
                        }).appendTo('#pubsWrapper').after("<br/>");
                    }


                    //add URL
                    $('<span/>', {
                        'class':'dataLabel',
                        'text': 'PUBLICATION URL: '
                    }).appendTo('#pubsWrapper');
                    $('<a/>',{
                        'class': 'dataValue',
                        'href' : data.ProjectPubs[index].URL,
                        'text' : data.ProjectPubs[index].URL,
                        'target' : '_blank'
                    }).appendTo('#pubsWrapper').after("<br/>","<br/>");
                });


                // CONTACT INFO TAB
                $("#contactsWrapper").empty();
                
                $.each(data.ProjectContacts, function(index){
                    $("<div/>",{
                        'class': 'contactName',
                        'text': data.ProjectContacts[index].ContactName
                    }).appendTo("#contactsWrapper");

                    $("<div/>",{
                        'class': 'regularFont',
                        'text': data.ProjectContacts[index].ContactOrgName
                    }).appendTo("#contactsWrapper");

                    $("<a/>",{
                        'href': 'mailto:'+data.ProjectContacts[index].ContactEmail,
                        'class': 'regularFont',
                        'text': data.ProjectContacts[index].ContactEmail
                    }).appendTo("#contactsWrapper");

                    if(data.ProjectContacts[index].ContactPhone != null || data.ProjectContacts[index].ContactPhone != undefined){
						$("<div/>",{
                        	'class': 'regularFont',
                        	'text': data.ProjectContacts[index].ContactPhone
                    	}).appendTo("#contactsWrapper").after("<br/>");

                    }
                    

                });

        }//END success
    });//END AJAX

    
}//END fillPopupFields()

function NullSitePopupFill(data){

    $('<div/>', {
        'class': 'contentPaneHeaders',
        'style': 'display: block; text-align: center',
        'text': 'No Sites Exist for this Project'
    }).appendTo("#projectLeftPanel");

    $("#titleSiteName").html(data.aProject.NAME);


                     //tab2 PROJECT SUMMARY
    $("#ProjectName").html("Project Name: " + data.aProject.NAME);

    //populate Orgs
    if(data.ProjOrgs.length > 0){
        //reset
        $('#orgs').empty();
        var orgValues = "";

        //loop through projOrgs
        $.each(data.ProjOrgs, function(index){
            var tempText = ""
            if (data.ProjOrgs[index].NAME != undefined || data.ProjOrgs[index].NAME != null){
                tempText = data.ProjOrgs[index].NAME;
            }
            if(data.ProjOrgs[index].DIVISION != undefined || data.ProjOrgs[index].DIVISION != null ){
                tempText += ", " + data.ProjOrgs[index].DIVISION;
            }

            if ( data.ProjOrgs[index].SECTION != undefined || data.ProjOrgs[index].SECTION != null ){
                tempText += ", " + data.ProjOrgs[index].SECTION;
            } 
            
            //compile the final string
            orgValues += tempText + "; "

        });

        //add the org text and assign class to the div
        $("#orgs").html(orgValues + "<br/>");
        $("#orgs").addClass("dataValue");
    } else{
    	$('#orgs').empty();
    }

    //multiple project urls are comma separated, get them as an array
    if (data.aProject.URL != null || data.aProject.URL != undefined){
    	var projectUrl = data.aProject.URL.split("|");
    	$("#projectWebsiteWrapper").empty();

    	$.each(projectUrl, function(index){
    		var urlString = projectUrl[index];
    		$("<a/>",{
            	'href': urlString,
            	'class': 'dataValue',
            	'text': urlString,
            	'target': "_blank"
        	}).appendTo("#projectWebsiteWrapper").after("; ");
    	});
    } else{
    	$("#projectWebsiteWrapper").empty();
    	$('<span/>', {
    		'class': 'dataValue',
    		'text': 'N/A'
    	}).appendTo("#projectWebsiteWrapper").after("</br>");
    }

    if (data.ProjStatus != null || data.ProjStatus != undefined){
		$("#projectStatusValue").html(data.ProjStatus);
	} else {
		$("#projectStatusValue").html("N/A");
	}
    
    if (data.aProject.START_DATE != null || data.aProject.START_DATE != undefined){
        var splitString = data.aProject.START_DATE.split("-");
        var removeTime = splitString[2].slice(0,-9);
        var formattedDate = splitString[1] + "/" + removeTime + "/" + splitString[0];
        $("#projectStartDateValue").html(formattedDate);
    } else{
    	$("#projectStartDateValue").html('N/A');
    }
    
    if (data.aProject.END_DATE != null || data.aProject.END_DATE != undefined){
        var splitString = data.aProject.END_DATE.split("-");
        var removeTime = splitString[2].slice(0,-9);
        var formattedDate = splitString[1] + "/" + removeTime + "/" + splitString[0];
        $("#projectEndDateValue").html(formattedDate);
    } else{
    	$("#projectEndDateValue").html('N/A');
    }

    
    $("#projectObjectiveValue").html(data.ProjectObjectives);

    if (data.ProjDuration != null || data.ProjDuration != undefined){
		$("#projectDurationValue").html(data.ProjDuration);
	} else {
		$("#projectDurationValue").html("N/A");
	}

    //TODO figure out new object syntax for aproject
    $("#projectDescriptionValue").html(data.aProject.DESCRIPTION);
    $("#projectKeywordsValue").html(data.ProjectKeywords);
    $("#additionalProjectInfoValue").html([ (data.aProject.ADDITIONAL_INFO) ? data.aProject.ADDITIONAL_INFO : "" ]);

    //dynamically build project data list
    //clear whatever is in there first
    $("#projectDataWrapper").empty();
	$.each(data.ProjectData, function(index){
		 //add DMS
		if (data.ProjectData[index].DESCRIPTION != null){
			$('<span/>', {
	            'class':'dataLabel',
	            'text': 'DATA MANAGEMENT SYSTEM: '
	        }).appendTo('#projectDataWrapper');
	        $('<span/>',{
	            'class': 'dataValue',
	            'text' : data.ProjectData[index].DESCRIPTION
	        }).appendTo('#projectDataWrapper').after("<br/>");
		}

        //add data hosting location
        if(data.ProjectData[index].HOST_NAME != null){
	       	$('<span/>', {
	            'class':'dataLabel',
	            'text': 'DATA HOSTING ENTITY: '
	        }).appendTo('#projectDataWrapper');
	        $('<span/>',{
	            'class': 'dataValue',
	            'text' : data.ProjectData[index].HOST_NAME
	        }).appendTo('#projectDataWrapper').after("<br/>");
        }
       	
        //add online data location
        if (data.ProjectData[index].PORTAL_URL != null){
	        $('<span/>', {
	            'class':'dataLabel',
	            'text': 'ONLINE DATA LOCATION (IF AVAILABLE): '
	        }).appendTo('#projectDataWrapper');
	        $('<a/>',{
	            'class': 'dataValue',
	            'href': data.ProjectData[index].PORTAL_URL,
	            'text' : data.ProjectData[index].PORTAL_URL,
	            'target': '_blank'
	        }).appendTo('#projectDataWrapper').after("<br/>","<br/>");
        }

	});
    

    //dynamically build project pubs list  USE #pubsWrapper element as container
    //clear whatever is in there first
    $("#pubsWrapper").empty();
    $.each(data.ProjectPubs, function(index){
        //add TITLE
        $('<span/>', {
            'class':'dataLabel',
            'text': 'PUBLICATION TITLE: '
        }).appendTo('#pubsWrapper');
        $('<span/>',{
            'class': 'dataValue',

            'text' : data.ProjectPubs[index].TITLE
        }).appendTo('#pubsWrapper').after("<br/>");

        //add pub DESCRIPTION, but only if there is something in the field
        if (data.ProjectPubs[index].DESCRIPTION != null){
            $('<span/>', {
                'class':'dataLabel',
                'text': 'PROJECT DESCRIPTION: '
            }).appendTo('#pubsWrapper');
            $('<span/>',{
                'class': 'dataValue',
                'text' : data.ProjectPubs[index].DESCRIPTION
            }).appendTo('#pubsWrapper').after("<br/>");
        }

        //add URL
        $('<span/>', {
            'class':'dataLabel',
            'text': 'PUBLICATION URL: '
        }).appendTo('#pubsWrapper');
        $('<a/>',{
            'class': 'dataValue',
            'href' : data.ProjectPubs[index].URL,
            'text' : data.ProjectPubs[index].URL,
            'target' : '_blank'
        }).appendTo('#pubsWrapper').after("<br/>","<br/>");
    });


    // CONTACT INFO TAB
    $("#contactsWrapper").empty();
    
    $.each(data.ProjectContacts, function(index){
        $("<div/>",{
            'class': 'contactName',
            'text': data.ProjectContacts[index].ContactName
        }).appendTo("#contactsWrapper");

        $("<div/>",{
            'class': 'regularFont',
            'text': data.ProjectContacts[index].ContactOrgName
        }).appendTo("#contactsWrapper");

        if (data.ProjectContacts[index].ContactEmail != null || data.ProjectContacts[index].ContactEmail != undefined){
        	$("<a/>",{
            	'href': 'mailto:'+data.ProjectContacts[index].ContactEmail,
            	'class': 'regularFont',
            	'text': data.ProjectContacts[index].ContactEmail
        	}).appendTo("#contactsWrapper");
        }

        if (data.ProjectContacts[index].ContactPhone != null || data.ProjectContacts[index].ContactPhone != undefined){
        	$("<div/>",{
            	'class': 'regularFont',
            	'text': data.ProjectContacts[index].ContactPhone
        	}).appendTo("#contactsWrapper").after("<br/>");
       } 
    });

    //clear out the PROJECT SITES SUBTABS
        //tab1 PROJECT SITES
        $("#siteNameValue").empty();
        $("#locationValue").empty();
        $("#stateValue").empty();
        $("#CountryValue").empty();
        $("#GreatLakeValue").empty();
        $("#waterbodyValue").empty();
        $("#watershedValue").empty();
        $("#siteDescriptionValue").empty();
        $("#siteStartDateValue").empty();
        $("#siteEndDateValue").empty();
        $("#statusValue").empty();
        $("#resourceComponentValue").empty();
        $("#mediaValue").empty();
        $("#samplingFrequencyValue").empty();
        $("#samplingPlatformValue").empty();
        $("#additionalSiteInfoValue").empty();
        

        $("#siteWebsiteValue").empty();

        //PARAMETERS subtab
        $("#bioWrapper").empty();
        $("#chemWrapper").empty();
        $("#microbioWrapper").empty();
        $("#physWrapper").empty();
        $("#toxicWrapper").empty();
                

}//END NullSitePopupFill

//TODO
function showProjectPopup(project){
    closeSitePopup();
    //empty the title div so there is no lag where the old value displays
    $("#titleSiteName").empty();

    var projectID = project[0];
    
    if (projectID.length > 0){
        
        var firstSiteId;

        $.ajax({
            dataType: "json",
            type: "Get",
            url: endpointRoot + "Sites/ProjectSitesInfo?ProjectId=" + projectID,
            headers:{
                Accept: "application/json",
                Host: "sigl.wim.usgs.gov"
            },
            success: function(data){
                
                $("#projectLeftPanel").empty();

                if(data.length > 0 && data[0].siteId != 0){

                    $.each(data, function(index){
                        var textValue = data[index].Name;
                        var idValue = data[index].SiteId;
                        if(index == 0){
                            firstSiteId = data[index].SiteId;
                        }
                        $('<div/>', {
                            'class':'dataLabel projectListItem',
                            'style' : 'display: block; cursor: pointer',
                            'text': textValue,
                            'id': idValue,
                        }).appendTo("#projectLeftPanel");
                    });

                    fillPopupFields(firstSiteId);

                    //assign onclick function to all dynamically created <a/> tags
                     $(".projectListItem").click(function() {
                        //remove .active from former and add to current
                        $('.projectListItem').removeClass('active');
                        $(this).addClass('active');
                        //get the siteId from the id of the link element
                        var siteId = this.id
                        console.log('siteID = ' + siteId);
                        
                        executeQueryTask(siteId);

                        fillPopupFields(siteId);
                    });
                } else {
                    //Project exists but does not have any sites

                    //if SiteId == 0 in the data object, use the aProject info to fill the popup instead of making the rest call
                    NullSitePopupFill(data);


                }

                
            }
        });
    }


	if(document.getElementById("sitePopupWrapper").style.display != 'block' || document.getElementById('sitePopupWrapper').style.display == 'hidden'){
        tabIndex = 0;
        //first time popup is opened
        if(document.getElementById("sitePopupWrapper").innerHTML == ""){
            $("#sitePopupWrapper").load('SitePopup/SitePopup.html', function(){
                $("#siteTabbedContainer").tabs("option", "active", tabIndex);
            });
            
            //$('#loading').css({display:'table'});
            $('#loadingT1').css({display:'table'});

            //FIXED POS. display in lower left corner of screen
            $('#sitePopupWrapper').css({
                    display:'block',
                    position: 'fixed',
                    bottom: '5px',
                    left: '5px'
                });
            
        //subsequent popup openings
        } else {

            //$('#loading').css({display:'table'});
            $('#loadingT1').css({display:'table'});

            $("#sitePopupWrapper").css({top: "", left: ""});
            $('#sitePopupWrapper').css({display:'block',
                    position: 'fixed',
                    bottom: '5px',
                    left: '5px'
                });
            $("#siteTabbedContainer").tabs("option", "active", tabIndex);

        }
    } else {
        //popup is open and user has clicked a new site
        //close the popup, but do not remove the graphic.
        $('#sitePopupWrapper').css({display:'none'});


        //$('#loading').css({display:'table'});
        $('#loadingT1').css({display:'table'});
        $("#sitePopupWrapper").css({top: "", left: ""});
        $('#sitePopupWrapper').css({display:'block',
                position: 'fixed',
                bottom: '5px',
                left: '5px'
            });
    }
    $(document).ajaxStop(function(){
        $('#loading').css({display:'none'});
        $('#loadingT1').css({display:'none'});
    });
}

function closeSitePopup(){
	$('#sitePopupWrapper').css({display:'none'});
    map.graphics.clear();
}

/*function closeProjectPopup(){
	$("#projectPopupWrapper").css({display:'none'});
}*/

/*function setSiteTab(){
        $("#siteTabbedContainer").tabs('option', 'active');
        $("#siteTabbedContainer").tabs("option", "active", 3);
        $("#siteTabbedContainer").tabs({selected: 3});
}*/

//Query task is set up in init function, methods are called from (".projectLeftPanel").click() events to display graphics on selected points.
function executeQueryTask(siteId){
    query.where = "SITE_ID = " + siteId;
    queryTask.execute(query, showResults);
}

function showResults(featureSet){
    map.graphics.clear();

    //var resultFeatures = featureSet.features;
    var resultGeom = featureSet.features[0].geometry;

    map.graphics.add(new esri.Graphic(new esri.geometry.Point([resultGeom.x,resultGeom.y], map.spatialReference), markerSymbol));
}

function showHelp(){
	alert("help button Click");
}


dojo.ready(init);
//IMPORTANT: while easy to miss, this little line above makes everything work. it fires when the DOM is ready and all dojo.require calls have been resolved. 
//Also when all other JS has been parsed, as it lives here at the bottom of the document. Once all is parsed, the init function is executed*