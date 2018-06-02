let Mn = require('backbone.marionette');
let L = require('leaflet');
let DeleteInstallationV = require('./DeleteInstallationV');
let AddOrEditInstallationV = require('./AddOrEditInstallationV');
let Utils = require('_common/utils');

let View = Mn.View.extend({

    initialize: function(){
    },

    ui: {
        'map': '[data-id="map"]',
        'edit-installation': '[data-id="edit-installation"]',
        'delete-installation': '[data-id="delete-installation"]'
    },

    events: {
        'click @ui.edit-installation': 'editInstallation',
        'click @ui.delete-installation': 'deleteInstallation'
    },

    onAttach: function() {

        if (this.model.get('type') === 'new') {
            return;
        }

        this.createMap();
    },

    createMap: function () {

        let map = L.map(this.getUI('map').get(0), { attributionControl: false });
        var center = this.model.get('location');

        map.setView(center, 13);

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        }).addTo(map);

        L.marker(center).addTo(map);
    },

    editInstallation: function (ev) {

        var editInstallationV = new AddOrEditInstallationV({
            model: this.model,
            onCloseModal: options => {

                if (options.refreshList) {
                    Radio.channel('public').trigger('refresh:installations');
                }
            }
        });

        Utils.showAsModal(editInstallationV, 'small'); 
    },

    deleteInstallation: function (ev) {

        var deleteInstallationV = new DeleteInstallationV({
            model: this.model,
            onCloseModal: options => {

                if (options.refreshList) {
                    Radio.channel('public').trigger('refresh:installations');
                }
            }
        });

        Utils.showAsModal(deleteInstallationV, 'small'); 
    }
});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
