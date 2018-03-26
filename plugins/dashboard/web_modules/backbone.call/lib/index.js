var _ = require('underscore');
var Backbone = require('backbone');
var Mn = require('backbone.marionette');
var BaseRouter = require('backbone.base-router');

var Router = BaseRouter.extend({

    constructor: function(routesConfig){

        this.routes = {};

        if(_.isObject(routesConfig) && !_.isArray(routesConfig)){
            routesConfig = [routesConfig];
        }
        _.each(routesConfig, this._addRoute, this);

        BaseRouter.prototype.constructor.apply(this, arguments);
    },

    addRoutes: function(routesConfig){

        if(!_.isObject(routesConfig)){
            throw new Error('routes config must be an object or array of objects');
        }

        if(_.isObject(routesConfig) && !_.isArray(routesConfig)){
            routesConfig = [routesConfig];
        }

        _.each(routesConfig, this._addRoute, this);
        this._bindRoutes();
    },

    _addRoute: function(routeObj){

        this.routes[routeObj.path] = routeObj;
    },

    onNavigate: function(routeData) {

        //debugger;
        var keys = ['query', 'params', 'uriFragment', 'originalRoute'];
        var isValid = true;

        if (_.isFunction(routeData.params, routeData.query) === false) {
            console.log('invalid params or query string');
            return;
        }

        //routeData.linked.handler(_.pick(routeData, keys), _.bind(this.renderTree, this));
        this._routeData = _.pick(routeData, keys);
        //routeData.linked.handler(this._routeData, _.bind(this.renderTree, this));
        this.renderTree(routeData.linked.viewTree, this._routeData)
        
    },

    renderTree: function(tree){
        //debugger;
        console.time('renderTree');
        if(!_.isObject(tree)){
            throw new Error('route tree must be an object or array of objects');
        }

        if(_.isObject(tree) && !_.isArray(tree)){
            tree = [tree];
        }

        var i, l = tree.length;
        for(i = 0; i < l; ++i){
            this._renderTree(
                null, 
                tree[i].region, 
                tree[i].viewClass,
                tree[i].viewOptions, 
                tree[i].forceRender,
                //tree[i].pre, 
                tree[i].viewTree
            );
        }
        console.timeEnd('renderTree');
    },

    getRegion: function(region, view){

        var _region;

        if(region instanceof Mn.Region){
            _region = region;
        }
        else if(typeof region === 'string' && view === null){
            var rootView = ...
            _region = rootView.getRegion(region);
        }
        else if(typeof region === 'string' && view instanceof Mn.View){
            _region = view.getRegion(region);    
        }
/*
        if(!_region){
            _region = this.getDefaultRegion(region, view);
        }
*/
        return _region;
    },

    // try to get the region from somewhere else (most likely a permanent region 
    // stored in Radio or some other object)
    getDefaultRegion: function(){},

    _renderTree: function(parentV, region, viewClass, viewOptions, forceRender, children){
            
        //debugger;

        var label = '_renderTree@' + (region instanceof Mn.Region ? 'root' : region);
        console.time(label);

        region = this.getRegion(region, parentV);
/*
        if(parentV && typeof region === 'string'){
            region = parentV.getRegion(region);
        }
*/
        // the initial call to showView doesn't have a parentV; in that case the region
        // property should be a reference to a region (the 'root' region of the tree)
        if(!(region instanceof Mn.Region)){
            throw new Error('region must be an instance of Mn.Region');
            // todo: show more details about the region
        }

        children = children || [];

        var i, l = children.length;
        var view;

        //debugger;
        // always true, 'pre' doesn't exist anymore


        // TODO: how to handle the case of using the same region class in botht he parent and view - will be cause trouble?
        if(region.currentView instanceof viewClass && forceNew !== true){

            // todo: set a global option to always have forceRender true
            if(forceRender === true){

                // the view is already in the DOM; just re-render it and proceed to the children
                region.currentView.render();
            }
            // the default action is to not re-render the view 
            // if we don't say anything (that is, forceRender is ommited)  it's as if we had 
            // "forceRender: false"
            else {

                // do nothing on this view, just proceed straight to the children
            }

            for(i = 0; i < l; ++i){
                this._renderTree(
                    region.currentView, 
                    children[i].region, 
                    children[i].viewClass,
                    children[i].viewOptions, 
                    children[i].forceRender,
                    children[i].children
                );
            }

            console.timeEnd(label);
            return;  
        }

        // TODO: add a "forceCreate" option (to always create a new instance)
        //debugger;
        viewOptions = viewOptions || {};
        viewOptions.request = this._routeData;
        view = new viewClass(viewOptions);
        view.render();

        for(i = 0; i < l; ++i){

            this._renderTree(
                view, 
                children[i].region, 
                children[i].viewClass, 
                children[i].viewOptions, 
                children[i].forceRender,
                children[i].children
            );
        }
        
        //debugger;
        // TODO: call handler
        if(_.isFunction(handler)){
            handler({ ... }, ...);
        }
        else {
            this.defaultHandler(view, region);
        }

       
        console.timeEnd(label);
        return;


    },

    defaultHandler: function(view, region){

        // 1) get the region from the parent view
        
        region.show(view, { preventRender: true });
    }

    start: function(options){

        // debugger;
        options = options || {}
        Backbone.history.start(options);
    }
})

module.exports = Router;
