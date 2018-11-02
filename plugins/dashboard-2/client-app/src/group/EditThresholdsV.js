let $ = require('jquery');
let Q = require('q');
let _ = require('underscore');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radio = require('backbone.radio');

let internals = {};


let View = Mn.View.extend({


    initialize: function(){

        this.model = new Backbone.Model();
        this.model.set({
            threshold1: 10,
            threshold2: 60,
            threshold3: 100,
        })
    },

    ui: {
        'save': 'button[data-id="save"]',
        'close': 'button[data-id="close"]',
        'threshold1': 'input[name="threshold1"]',
        'threshold2': 'input[name="threshold2"]',
        'threshold3': 'input[name="threshold3"]',
    },

    events: {
        'click @ui.save': 'save',
        'click @ui.close': 'closeModal',
        'keyup @ui.threshold1': 'syncInput',
        'keyup @ui.threshold2': 'syncInput',
        'keyup @ui.threshold3': 'syncInput'
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


    closeModal: function(e, options){

        options = options || {};
        this.triggerMethod('close:modal', options);
    },

    save: function(){

debugger

/*
        // for new devices, this.model.get('id') is undefined , so it will be removed by JSON.stringify
        let data = _.extend({}, this.model.toJSON(), Backbone.Syphon.serialize(this));

        let p = Q($.ajax({
            url: '/api/upsert-devices',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json; charset=utf-8',
        }));

        p = p.then(response => {

            if (response.length === 1 && response[0].id > 0) {
                // TODO: show a success message
                this.triggerMethod('close:modal', { refreshList: true });    
            }
            else {
                this.triggerMethod('close:modal', {});
            }

        })

        p = p.catch(err => {
//debugger
            if (err.responseJSON && err.responseJSON.statusCode === 400) {
                if (err.responseJSON.message === 'mac_invalid_text_representation') {
                    alert('ERROR: mac format is invalid')
                }
                else if (err.responseJSON.message === 'installation_id_mac') {
                    alert('ERROR: this unit was already added for this installation')
                }
                else if (err.responseJSON.message === 'mac_activation_key') {
                    alert('ERROR: this activation key was already used for this unit')
                }
                else if (err.responseJSON.message === 'no_data_found') {
                    alert('ERROR: this unit does not exist anymore')
                }
            }
            else if (err.responseJSON && err.responseJSON.statusCode === 500) {
                alert('ERROR: could not save data. Please refresh the page and try again.')
            }

            // TODO: check for 404 error - not found, for the cases when the device was already deleted
            // TODO: check for 400 error - not found, for the cases when the mac is already added to this installation
            
        })
*/
    },

    syncInput: function (ev){

        let $target = $(ev.target);
        let updatedValue = $target.val();
        let attrName = $target.attr('name');

        if (updatedValue === this.model.get(attrName)) {
            return;
        }

        this.getUI(attrName).each(function(i, el){

            if (el === ev.target) { return }
            $(el).val(updatedValue)
        })
        // ...

    }

});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
