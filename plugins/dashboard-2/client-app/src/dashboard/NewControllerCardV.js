let Backbone = require('backbone');
let Mn = require('backbone.marionette');
let AddOrEditInstallationV = require('./AddOrEditInstallationV')
let Utils = require('../_common/utils')


let View = Mn.View.extend({

    initialize: function(){
    },

    ui: {
    	'new-installation': '[data-id="new-installation"]'
    },

    events: {
    	'click @ui.new-installation': 'addNewInstallation'
    },

    onAttach: function() {
    },

    addNewInstallation: function(ev){

    	var addOrEditInstallationV = new AddOrEditInstallationV({

    	    model: new Backbone.Model,
    	    onCloseModal: options => {}
    	});

    	Utils.showAsModal(addOrEditInstallationV, 'small');
    }


});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
