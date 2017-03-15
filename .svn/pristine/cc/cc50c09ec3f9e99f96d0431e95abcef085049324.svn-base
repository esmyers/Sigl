


function searchLogic(){

	var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
   // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
   var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
   // At least Safari 3+: "[object HTMLElementConstructor]"
   var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
   var isIE = /*@cc_on!@*/false || !!document.documentMode; 


   var version = detectIE();

   if(version !== false){
   		alert("Internet Explorer users may experience issues with SiGL's search functionality. We recommend using Edge, Chrome, or Firefox for best results.");
   }

   function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // Edge (IE 12+) => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
}



   //variables for search returns
   var allParameters;

   //NEEDED FOR CROSS DOMAIN AJAX REQUESTS IN IE
   $.support.cors = true;

	//GET parameters AND parameter groups
	$.ajax({
		dataType: 'json',
		type: 'Get',
		url:  endpointRoot +'parameters.json',
		cache: false,
		contentType: "application/json",
		headers:{
			Accept: 'application/json',
			//Host: 'services.wim.usgs.gov'
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length>0){
				//place individual parameters into the appropriate optGroup (groups hardcoded in markup)
				$.each(data, function(){
					if (this['parameter_group'] == 'Physical'){
						$("#Physical").append($('<option></option>').val(this['parameter_type_id']).html(this['parameter']));
					
					} else if (this['parameter_group'] == 'Chemical'){
						$("#Chemical").append($('<option></option>').val(this['parameter_type_id']).html(this['parameter']));
					
					} else if (this['parameter_group'] == 'Biological'){
						$("#Biological").append($('<option></option>').val(this['parameter_type_id']).html(this['parameter']));
					
					} else if (this['parameter_group'] == 'Microbiological'){
						$("#Microbiological").append($('<option></option>').val(this['parameter_type_id']).html(this['parameter']));
					} 

					else if (this['parameter_group'] == 'Toxicological'){
						$("#Toxicological").append($('<option></option>').val(this['parameter_type_id']).html(this['parameter']));
					} 

				});
				$('#parameterGroupSelector').multipleSelect('refresh');
			}
		},
		error: function(xhr, status, error){
			alert(error, xhr.status);
		}
	});

	//RESOURCE COMPONENT #resourceComponentSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "ResourceTypes.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$('#resourceComponentSelector').append($("<option></option>").val(this['resource_type_id']).html(this['resource_name']));
				});
				$("#resourceComponentSelector").multipleSelect("refresh");
			}
			
		},
		error: function(textStatus, error){
			console.log(error);
			console.log(textStatus);
		}

	});

	//for PROJECT DURATION and PROJECT STATUS dropdown calls look below in the list of calls for the PROJECT SEARCH TAB

	//media  #mediaSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "Media.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					if (this['media'].length > 27) {
						var optionText = this['media'].substring(0,28) + "...";
						$('#mediaSelector').append($("<option></option>").val(this['media_type_id']).html(optionText));
					} else{
						$('#mediaSelector').append($("<option></option>").val(this['media_type_id']).html(this['media']));
					}
					
				});
				$("#mediaSelector").multipleSelect("refresh");
			}
			
		}
	});

	//LAKE SELECT #lakeSelector and #projectLakeSelector
	$.ajax({
		dataType: 'json',
		type: 'Get',
		url:  endpointRoot +'Lakes.json',
		cache: false,
		headers:{
			Accept: 'application/json',
			//Host: 'services.wim.usgs.gov'
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$('#lakeSelector').append($('<option></option>').val(this['lake_type_id']).html(this['lake']));
					$("#projectLakeSelector").append($("<option></option>").val(this['lake_type_id']).html(this['lake']));
				});
				$('#lakeSelector').multipleSelect('refresh');
				$("#projectLakeSelector").multipleSelect("refresh");
			}
		}
	});

	//Monitoring Effort Select #monitoringSelector and #projectMonitoringSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "MonitorCoordinations.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$("#monitoringSelector").append($("<option></option>").val(this['monitoring_coordination_id']).html(this['effort']));
					$("#projectMonitoringSelector").append($("<option></option>").val(this['monitoring_coordination_id']).html(this['effort']));
					//TODO Add in length restrictor here....
				});
				$("#monitoringSelector").multipleSelect("refresh");
				$("#projectMonitoringSelector").multipleSelect("refresh");

			}
		}
	});


	//STATE REQUEST #stateSelector and #projectStateSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "sites/StatesWithSites.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$("#stateSelector").append($("<option></option>").html(this));
					$("#projectStateSelector").append($("<option></option>").val(this).html(this));
				});
				$("#stateSelector").multipleSelect("refresh");
				$("#projectStateSelector").multipleSelect("refresh");
			}
		}
	});

	//ALL PROJECT NAME REQUEST #projectSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "projects.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					//if (this['NAME'].length > 14) {
						//var optionText = this['NAME'].substring(0,15) + "...";
						//$("#projectSelector").append($("<option></option>").val(this['PROJECT_ID']).html(optionText));


					//} else{
						$("#projectSelector").append($("<option></option>").val(this['project_id']).html(this['name']));
					//}
				});
				$("#projectSelector").multipleSelect("refresh");
			}
		}
	});


	//ORGANIZATION REQUEST #organizationSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "organizations.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					//SUBSTRINGING NOW DONE IN THE JQUERY MULTIPLE SELECT
					//if (this['NAME'].length > 10){
						//var optionText = this['NAME'].substring(0,11) + "...";
						//$("#organizationSelector").append($("<option></option>").val(this['organization_id']).html(optionText));
					//} else{
						$("#organizationSelector").append($("<option></option>").val(this['organization_id']).html(this['organization_name']));
					//}
				});
				$("#organizationSelector").multipleSelect("refresh");
			}
		}
	});


				//use above?
				//el.textContent = (opt.children[2].textContent).substring(0, 28) + "...";
				//el.title = opt.children[2].textContent;

	//PROJECT OBJECTIVE REQUEST #objectiveSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "objectives.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$("#objectiveSelector").append($("<option></option>").val(this['objective_type_id']).html(this['objective']));
					//TODO Add in length restrictor here....
				});
				$("#objectiveSelector").multipleSelect("refresh");
			}
		}
	});

	//PROJECT DURATION REQUEST 	#projectDurationSelector AND #durationSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "ProjectDuration.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$("#projectDurationSelector").append($("<option></option>").val(this['proj_duration_id']).html(this['duration_value']));
					$("#durationSelector").append($("<option></option>").val(this['proj_duration_id']).html(this['duration_value']));
				});
				$("#projectDurationSelector").multipleSelect("refresh");
				$("#durationSelector").multipleSelect("refresh");
			}
		}
	});


	//PROJECT STATUS REQUEST 	#projectStatusSelector  AND #statusSelector
	$.ajax({
		dataType: "json",
		type: "Get",
		url: endpointRoot + "ProjectStatus.json",
		cache: false,
		headers:{
			Accept: "application/json",
			//Host: "services.wim.usgs.gov"
			Host: 'sigl.wim.usgs.gov'
		},
		success: function(data){
			if (data.length > 0){
				$.each(data, function(){
					$("#projectStatusSelector").append($("<option></option>").val(this['proj_status_id']).html(this['status_value']));
					$("#statusSelector").append($("<option></option>").val(this['proj_status_id']).html(this['status_value']));
				});
				$("#projectStatusSelector").multipleSelect("refresh");
				$("#statusSelector").multipleSelect("refresh");
			}
		}
	});

}//END SearchLogic

	
