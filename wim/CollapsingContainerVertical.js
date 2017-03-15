
/*
	Copyright: 2013 WiM - USGS
	Author: Erik Myers USGS Wisconsin Internet Mapping
	Created: 12.30.2013	
	Adapted from: wim.CollapsingContainer
*/
dojo.provide("wim.CollapsingContainerVertical");

dojo.require("dijit._Container");
dojo.require("dijit._TemplatedMixin");
dojo.require("dijit._OnDijitClickMixin");
dojo.require("dijit._WidgetBase");
dojo.require("dojo.fx");
dojo.require("dojo._base.fx");
dojo.require("dojox.fx.ext-dojo.complex");



dojo.declare("wim.CollapsingContainerVertical", [ dijit._WidgetBase, dijit._OnDijitClickMixin, dijit._Container, dijit._TemplatedMixin ],
{
	templatePath: dojo.moduleUrl("wim","templates/CollapsingContainerVertical.html"),
	
	/* Define your component custom attributes here ... */
	baseClass: "collapsingContainerVertical",
	title: "coolContainer",
	titleImageUrl: null,
	startCollapsed: false,
	
	getContentNode: function() {
		return this.containerNode;
		
	},
	
	constructor: function() {
	},	
		
		
	//new iconClick handler
	_onIconClick: function() {
		var animationDuration = 175;
		if (dojo.getStyle(this.containerNode, "display") == "none") {
			//build a custom animation
			var entranceAnimation = dojo.fx.combine([

				dojo._base.fx.animateProperty({
					node: this.domNode,
					properties:{
						width: 270
					},	
					duration: animationDuration
				}),
				dojo.fx.wipeIn({node: this.containerNode, duration: animationDuration}) //show container content
			]);


			entranceAnimation.play(); //run combined animation
			
		} else {
			var exitAnimation = dojo.fx.combine([
				//build the reverse custom animation
				dojo.fx.wipeOut({node: this.containerNode, duration: animationDuration}), //hide container content
				dojo._base.fx.animateProperty({
					node: this.domNode,
					properties:{
						width: 170
					},
					duration: animationDuration
				})	
			]);
			  
			exitAnimation.play();  //run combined animation
		}
	},	


	postCreate: function(){
		this.titleNode.innerHTML = this.title;
	
		// add here anything that will be executed in after the DOM is loaded and ready.
		// For example, adding events on the dojo attach points is suitable here.	
		var localTitle = this.title;
				
		// Attach an onclick event on the user name node.		
		/*dojo.connect(this.nameNode, "onclick", function (event) {
			alert("The selected name is: " + localTitle);
		});	*/
		
		if (this.titleImageUrl != null) {
			//Do something here to handle unique images to put before titles
		}

		if (this.startCollapsed == true){
			this._onIconClick();
		}
	}
	
});