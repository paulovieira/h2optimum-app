

var _ = require('underscore');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var BaseRouter = require('backbone.base-router');
//require('./show');

// in global mode, BaseRouter will be passed to the factory function as window['Backbone']['BaseRouter']

if(!BaseRouter){
	throw new Error('backbone.base-router must be loaded before backbone.call')
}

var CallRouter = BaseRouter.extend({

    constructor: function(options){

		this.options = _.extend({ requestProperty: 'request' }, options)
		this.routes = {};
		
    	BaseRouter.prototype.constructor.apply(this, arguments);
    },

    addRoutes: function(routesConfig){

		routesConfig = this._wrapInArray(routesConfig);
        routesConfig.forEach(this._addRoute, this)

        Backbone.Router.prototype._bindRoutes.call(this)
    },

    addRoute: function(routeConfig) {

    	this.addRoutes(routeConfig);
    },

    start: function(startOptions){

    	// reference: http://backbonejs.org/#History-start
        Backbone.history.start(startOptions);
    },

    onNavigate: function(routeData) {
//debugger;
        
        //this.renderTree(routeData.linked.root, routeData.linked.children, _.pick(routeData, keys));
//debugger
        // parent for the 1st level nodes
        var parent = this.options.root;
        var children = this._wrapInArray(routeData.linked.children);

        if (parent instanceof Mn.Region && children.length > 1) {
        	throw new Error('the configuration for route ' + routeData.originalRoute + ' has ' + children.length + ' elements in the initial branch but the root container is a region (use a view instance with ' + children.length + ' regions instead)')
        }

        var keys = ['query', 'params', 'uriFragment', 'originalRoute'];
        var requestData = _.pick(routeData, keys);
        requestData._tsInitial = Date.now();
        
//debugger
        var validate = routeData.linked.validate || _.noop;
        var shouldProceed = validate(requestData);
//debugger
        if (shouldProceed === false) {
    		return;
        }

        this._handleChildren(parent, children, requestData, null, null);        	


//debugger
 		var x = 3;
    },

    _handleChildren: function (parent, children, requestData, resolve1, reject1) {
//debugger

		children = this._wrapInArray(children);
		if (children.length === 0) {

			// if this is a leaf, resolve immediately
			if (resolve1) {
				resolve1({ view: parent });	

				// TODO: is this code run before or after the .then call back associated to resolve?
				var x = 1;
				var y = 2;
			}
			
			return;
		}

		children.forEach((child, i) => {
//debugger

			var region;
			if (parent instanceof Mn.View) {
				region = this._getRegion(parent, child.region, i)
			}
			else {
				region = parent;
			}

			if (region instanceof Mn.Region === false) {
			    throw new Error('"' + regionName + '" must be an instance of Mn.Region');
			    // todo: show more details about the region
			}


			// TODO: add a "forceCreate" option (to always create a new instance)

			var viewOptions = child.viewOptions || {};

			// TODO: the property should be configurable
			viewOptions[this.options.requestProperty] = requestData;
			

			if (!_.isFunction(child.handler)) {
				child.handler = this.defaultHandler;
			}

			if (!_.isFunction(child.mount)) {
				child.mount = this.defaultMount;
			}
//debugger
			var view = child.handler.call(this, child.view, viewOptions);

			var isPromise = view instanceof Promise;

			if (isPromise === false) {
				this._handleChildren(view, child.children, requestData, null, null);
				child.mount.call(this, region, view);

				if (resolve1) {
					resolve1({ view: parent });
				}

			}
			else {

				view = view.then(obj => {
	//debugger	
					// return a new promise that will be resolved inside the new call (recursive)

					return new Promise((resolve2, reject2) => {
						//debugger
						this._handleChildren(obj.view, child.children, requestData, resolve2, reject2);	
					});
				})

				view = view.then(obj => {
					//debugger
					child.mount.call(this, region, obj.view);
					if (resolve1) {
						resolve1({ view: parent });
					}
					
				})
				
				view = view.catch(err => {
					//debugger
				})

			}


			// --- move to the forEachAsync implementation; must be executed after the call to done
			// alternative: create a promise here, for each element in the children array; that is, the 
			// render method should return a promise; however this might not work because the 
			// promise callback is always execute in a future tick of the event loop (?)

		    // ---
		})

    },

    defaultHandler: function(viewClass, viewOptions){

    	viewOptions[this.options.requestProperty]._ts = Date.now();
    	var viewInstance = new viewClass(viewOptions);
    	viewInstance.render();

    	return viewInstance;
    },


    defaultMount: function(region, view){
//debugger
    	region.show(view)
    },


    _wrapInArray: function(obj){

    	var outArray;

    	if (obj === undefined || obj === null) {
    		outArray = []
    	}
    	else if(_.isArray(obj)){
    		outArray = obj;
    	}
    	else {
    		outArray = [obj];
    	}

    	return outArray;
    },

    _addRoute: function(routeObj){

        this.routes[routeObj.path] = routeObj;
    },

    // get the region from the parent view; the region can be given explicitely
    // (if a string is given in the 'region' property), or implicitely (if no such 
    // string is given, in which case the index in the branch array is used)

    _getRegion: function(parent, regionName, i) {

		regionName = regionName || Object.keys(parent.getRegions()).sort()[i];

    	if (typeof regionName === 'string'){
    	    region = parent.getRegion(regionName);    
    	}

    	return region;
    }







})

Backbone.CallRouter = CallRouter;
module.exports = CallRouter;



