let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radio = require('backbone.radio');

let internals = {};

let View = Mn.View.extend({


    initialize: function(){
    },

    ui: {
        'save': 'button[data-id="save"]',
        'close': 'button[data-id="close"]'
    },

    events: {
        'click @ui.save': 'save',
        'click @ui.close': 'closeModal'
    },

    behaviors: [
        {
            behaviorClass: require('../_common/behaviors/ModalB'),

            // reference: https://getbootstrap.com/docs/4.0/components/modal/
            modalOptions: {
                backdrop: 'static',  // use a backdrop which doesn't close the modal on click
            }
        },
    ],

    regions: {
    },

    onRender: function () {
        
    },

    closeModal: function(e, options){

        options = options || {};
        this.triggerMethod('close:modal', options);
    },

});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
