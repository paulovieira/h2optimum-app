//var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
//debugger;
var Mn = require('backbone.marionette');
var Marionette = Mn;
var Radio = require("backbone.radio");


Mn.View.setRenderer(function(template, data) {

    //debugger;
    if (!template) {
        throw new Mn.Error({
            name: 'TemplateNotFoundError',
            message: 'Cannot render the template since its false, null or undefined.'
        });
    }

    try {
        var x = template.render(data);
        return template.render(data);
    } 
    catch (err) {
        throw new Mn.Error({
            name: 'NunjucksError',
            message: err.message
        });
    }
});



// handle the case where the model has a collection as an attribute;
// we want the call to .serializeData to return an array of serialized
// js objects (relative to the data in that collection)


Marionette.View.prototype.serializeModelOriginal = Marionette.View.prototype.serializeModel;

Marionette.View.prototype.serializeModel = function serializeModel() {

    if (!this.model) {
      return {};
    }

    let data = _.clone(this.model.attributes);

    this.model.keys().forEach(function(key){

        let collection = this.model.get(key);
        if (collection instanceof Backbone.Collection){
            data[key] = Marionette.View.prototype.serializeCollection.call({ collection: collection });
        }
    }, this);

    return data;
};

// overwrite this internal method from Backbone.History (NOTE: it is not documented!); this will
// allow to use hash urls that have a leading slash (like http://server.com/Bi/#/dashboard);
// Backbone doesn't allow this explicitely; note that it will give problems if we use push state;

// https://github.com/jashkenas/backbone/issues/848
// "There's no technical reason if you're using hashchange"
// "Leading slashes make no sense if you're using pushstate."


console.log('TODO: add an option "allowLeadingSlash" to CallRouter.start; in that case we overwrite getFragment')
Backbone.history.getFragment = function (fragment) {

    if (this._useHashChange && !this._usePushState) {

        if (fragment == null) {
            fragment = this.getHash();
        }
        
        return fragment;
    }

    return Backbone.History.prototype.getFragment(fragment);
};
  