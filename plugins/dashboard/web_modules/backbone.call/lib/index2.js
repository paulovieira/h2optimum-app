var _ = require('underscore');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');

var internals = {
    NAMED_PARAM: /(\(\?)?[:*]\w+/g,  // copied from Backbone (it's not exposed)
    PLUS_SYMBOL: /\+/g,
}

var CallRouter = Backbone.Router.extend({

    constructor: function(options) {

        this.options = _.extend({ requestProperty: 'request' }, options);

        this.routeParams = {};
        Backbone.Router.prototype.constructor.apply(this, arguments);
    },

    start: function(startOptions){

        // reference: http://backbonejs.org/#History-start
        Backbone.history.start(startOptions);
    },

    addRoutes: function(routesConfig){

        routesConfig = internals._wrapInArray(routesConfig);
        routesConfig.forEach(this._addRoute, this)
    },

    addRoute: function(routeConfig) {

        this.addRoutes(routeConfig);
    },

    _addRoute: function(routeConfig) {

        var origRoute = routeConfig.path;
        var route, routeStr;

        if (_.isRegExp(origRoute)) {
            route = origRoute;
            routeStr = '' + origRoute;
        } 
        else {
            route = this._routeToRegExp(origRoute);
            routeStr = origRoute;
        }
  
        this.routeParams[origRoute] = _.map(routeStr.match(internals.NAMED_PARAM), function (param) {
            return param.slice(1);
        });
  
        // register a callback with history (add the callback directly to the history handlers array)
        var router = this;

        // similar to Backbone.history.route, but uses push() instead of unshift()
        this._pushHandler.call(Backbone.history, route, function (fragment) {

            // extract params and query string
            var params = router._extractParameters(route, fragment);
            var queryString = params.pop();

            var routeData = {
                _tsInitial: Date.now(),
                route: route,
                originalRoute: origRoute,
                uriFragment: fragment,
                params: internals._getNamedParams(routeStr, params),
                queryString: queryString,
                query: internals._getQueryParameters(queryString)
            }

            var parent = router.options.root;
            var children = internals._wrapInArray(routeConfig.children);

            if (parent instanceof Mn.Region && children.length > 1) {
            	throw new Error('the configuration for route ' + routeData.originalRoute + ' has ' + children.length + ' elements in the initial branch but the root container is a region (use a view instance with ' + children.length + ' regions instead)')
            }

            var shouldProceed = (routeConfig.validate || _.noop) (routeData);
            if (shouldProceed === false) { return }

            // start the recursive call
            router._handleChildren(parent, children, routeData, null, null); 
        });
  
        return this;
    },

    // similar to  as Backbone.history.route, but uses push() instead of unshift()
    // note that the handlers property is not documented, so this method might give problems in the future
    _pushHandler: function (route, callback) {

        Backbone.history.handlers.push({ route: route, callback: callback });
    },

    _handleChildren: function (parent, children, requestData, resolve1, reject1) {
//debugger

		children = internals._wrapInArray(children);
		if (children.length === 0) {

			// if this is a leaf, resolve immediately
			if (resolve1) {
				resolve1({ view: parent });	
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
				child.handler = this.handler;
			}

			if (!_.isFunction(child.mount)) {
				child.mount = this.mount;
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

    // default handler
    handler: function(viewClass, viewOptions){

    	viewOptions[this.options.requestProperty]._ts = Date.now();
    	var viewInstance = new viewClass(viewOptions);
    	viewInstance.render();

    	return viewInstance;
    },

    // default mount
    mount: function(region, view){

    	region.show(view)
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

internals._wrapInArray = function(obj){

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
};

// Decodes the Url query string parameters & and returns them
// as an object. Supports empty parameters, but not array-like
// parameters (which aren't in the URI specification)
internals._getQueryParameters = function(queryString) {

    if (!queryString) { return {}; }

    return _.reduce(queryString.split('&'), function(memo, param) {

        var parts = param.replace(internals.PLUS_SYMBOL, ' ').split('=');
        var key = parts[0];
        var val = parts[1];

        key = decodeURIComponent(key);
        val = val === undefined ? null : decodeURIComponent(val);

        // If we don't have the value, then we set it.
        if (!memo[key]) {
            memo[key] = val;
        }

        // Otherwise, if we have the value, and it's an array,
        // then we push to it.
        else if (_.isArray(memo[key])) {
            memo[key].push(val);
        }

        // Otherwise, we have a value that is not yet an array,
        // so we convert it to an array, adding the newest value.
        else {
            memo[key] = [memo[key], val];
        }

        return memo;
    }, {});
};
  
// Returns the named parameters of the route
internals._getNamedParams = function(route, params) {

    if (!params.length) { return {}; }

    var routeKeys = this.routeParams[route];
    var routeValues = params.slice(0, routeKeys.length);

    return _.reduce(_.zip(routeKeys, routeValues), function (obj, opts) {

        obj[opts[0]] = opts[1];

        return obj;
    }, {});
};

Backbone.CallRouter = CallRouter;
module.exports = CallRouter;

