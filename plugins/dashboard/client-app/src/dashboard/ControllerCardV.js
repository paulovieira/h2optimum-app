var Mn = require('backbone.marionette');
var L = require('leaflet');

var View = Mn.View.extend({

    initialize: function(){
    },

    ui: {
        'map': '[data-id="map"]'
    },

    onAttach: function() {

        if (this.model.get('type') === 'new') {
            return;
        }

        this.createMap();
    },

    createMap: function () {

        let map = L.map(this.getUI('map').get(0), { attributionControl: false });
        var center = this.model.get('center');

        map.setView(center, 13);

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        }).addTo(map);

        L.marker(center).addTo(map);
    }
});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
