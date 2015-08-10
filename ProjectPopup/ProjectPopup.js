$(function(){

	
	$("#projectTabbedContainer").tabs();
	$("#tab2MainContentWrapper").tabs();

	//cancel tabbed container draggable handle to preserve scrollability
	$("#projectPopupWrapper").draggable({
		containment: "#map", 
		cancel: "#projectTabbedContainer", 
		scroll: false
	});
	$("#projectPopupContainer").css({display:'block'});
	

	//http://107.20.206.65/LaMPServices/Sites/41
	$("#stateValue").html('&nbsp;' + 'Wisconsin');
	$("#CountryValue").html('&nbsp;' + 'United States');

	$("#ProjectName").text("PROJECT NAME:  NAME HERE****");

	//SETUP KNOCKOUT JS BINDABLE VARIABLES
	function AppViewModel() {
	this.prjProjectName = "Lake Ontario Lower Aquatic Food Web Assessment (LOLA)";
	
	}

	//apply bindings using KNOCKOUT.JS
	ko.applyBindings(new AppViewModel());


});


//For working with site items within nested tabs.
$('a.siteLink').click(function(){

		$("a.siteLink").removeClass("active");
		$(this).addClass("active");
		
	
});

