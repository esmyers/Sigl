$(function(){

	//create the tabbed containers
	$("#siteTabbedContainer").tabs();
  	$("#tab4").tabs();
  	//make popup wrapper draggable
  	$("#sitePopupWrapper").draggable({
		containment: "#map", 
		cancel: "#siteTabbedContainer", 
		scroll: false
	});

	$("#sitePopupContainer").resizable({
		alsoResize: "#siteTabbedContainer, #sitesTabMainContentWrapper, .loader, #projectLeftPanel",
		minWidth: 745,
		minHeight: 155,
	});

  	$("#sitePopupContainer").css({display:'block'});

/*function showKOPopup(projectID){
   
   var popupViewModel = function(projectList) {
        var projectID = projectList[0];        

        titleSiteName: ko.observable(projectID)

        function getProj(projectID){
            $.ajax({
                dataType: "json",
                type: "Get",
                url: "http://107.20.206.65/LaMPServices/Sites/ProjectSitesInfo?ProjectId=" + projectID,
                headers:{
                    Accept: "application/json",
                    Host: "107.20.206.65"
                },
                success: function(data){
                    titleSiteName(data.aProject.NAME);
                }
            });
        }
        ko.applyBindings(new popupViewModel(projectList));
    }
}*/

});

