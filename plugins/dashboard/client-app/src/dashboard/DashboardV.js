let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radiox = require('backbone.radio');

let ControllerCardV = require('./ControllerCardV')
let NewControllerCardV = require('./NewControllerCardV')

let internals = {};




let View = Mn.View.extend({

    // important: the root element of the first child view inside the 'main-container' region must be a main.main-container
    // (in fact the element of the 'for-main-container' will be removed because we use the replaceElement optoin)

    tagName: 'main',
    className: 'main-container',

    initialize: function(){
    },

    ui: {
        'footer': '[data-region-id="footer"]',
        'main-content': 'div.main-content'
    },

    regions: {
        'footer': '@ui.footer',
    },

    onRender: function () {

        var data = this.fetchData();

        // we'll always have at least 1 card (the "add controller" card)
        /*
        this.getUI('main-content').append(`
            <div class="row">
                <div class="col-sm-4" data-region-id="card-0">
                </div>
            </div>
        `);
        */

        var numControllers = data.length;
        var numRows = Math.ceil(numControllers / 3);

        let controllerIndex = 0;
        for (let i = 0; i < numRows; i++) {

            this.getUI('main-content').append(`
                <div class="row" data-id="row-${ i }">
                </div>
            `);

            for (j = 0; j < 3; j++) {
                if (controllerIndex >= numControllers) {
                    break;
                }

                this.$(`[data-id="row-${ i }"]`).append(`
                    <div class="col-sm-4" data-region-id="card-${ controllerIndex }">
                    </div>
                `)

                let regionName = `card-${ controllerIndex }`;
                let regionSelector = `[data-region-id="card-${ controllerIndex }"]`;
                this.addRegion(regionName, regionSelector);

                controllerIndex++;
            }
        }

        for (controllerIndex = 0; controllerIndex < numControllers; controllerIndex++) {

            let controllerCardV;
            let model = new Backbone.Model(data[controllerIndex]);

            if (model.get('type') === 'new') {
                controllerCardV = new NewControllerCardV({ 
                    model: model
                });
            }
            else {
                controllerCardV = new ControllerCardV({ 
                    model: model
                });
            }


            this.showChildView(`card-${ controllerIndex }`, controllerCardV);
        }

    },

    fetchData: function () {

        var data = Radio.channel('public').request('installations');
        var newController = [{
            type: 'new',
            name: 'New controller',
            description: 'Click to add a new group',
        }]

        return data.concat(newController);
    }
});

// TODO: create dinamically the number of regions? add a dynamic numer of cards (like a collection view, but not exaclty the same)
//console.log(View.prototype.regions)


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
