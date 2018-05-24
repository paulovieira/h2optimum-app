let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radio = require('backbone.radio');

let internals = {};

let View = Mn.View.extend({

    initialize: function(){
    },

    ui: {
        'trigger-source': '[data-id="trigger-source"]'
    },

    behaviors: [
        {
            behaviorClass: require('../_common/behaviors/BootstrapSelectpickerB')
        }
    ],

    events: {
        'changed.bs.select @ui.trigger-source': 'onChangeTriggerSource'
    },

    regions: {
    },

    onRender: function () {
//debugger
        
    },

    onChangeTriggerSource: function (ev, index, newValue, oldValue) {

        this.toggleTriggerOptions('trigger-1', 'hide')
        this.toggleTriggerOptions('trigger-2', 'hide')
        this.toggleTriggerOptions('trigger-3', 'hide')

        let selectedValue = this.getUI('trigger-source').val()
        this.toggleTriggerOptions(selectedValue, 'show')
    },

    toggleTriggerOptions: function (triggerId, method) {

        let selector = `[data-id=${ triggerId }]`;
        (this.$(selector)[method])();
    },

});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
