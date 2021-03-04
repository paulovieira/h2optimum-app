let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radiox = require('backbone.radio');
let  Q = require('q');
let ControllerCardV = require('./ControllerCardV')
let NewControllerCardV = require('./NewControllerCardV')
let AddOrEditInstallationV = require('./AddOrEditInstallationV')
let Utils = require('_common/utils')

let internals = {};

let View = Mn.View.extend({

    // important: the root element of the first child view inside the 'main-container' region must be a main.main-container
    // (in fact the element of the 'for-main-container' will be removed because we use the replaceElement optoin)

    tagName: 'main',
    className: 'main-container',

    initialize: function(){

        this.fetchAndRender();
        this.listenTo(Radio.channel('public'), 'refresh:installations', () => { 

            this.fetchAndRender();
        });
    },

    ui: {
        'footer': '[data-region-id="footer"]',
        'main-content': 'div.main-content',
        'new-installation': '[data-id="new-installation"]',
        'cards-container': '[data-id="cards-container"]'
    },

    events: {
        'click @ui.new-installation': 'addNewInstallation'
    },

    regions: {
        'footer': '@ui.footer',
    },

    fetchAndRender: function(){

        Utils.fetchInstallations()
            .then(() => { this.render() })

    },

    onRender: function () {

        let data = Radio.channel('public').request('installations');

        if(data === undefined) {
            return
        }

        // TODO: place the new installation as a small item in the top of this view
        let newInstallation = data.pop();
        data.splice(0, 0, newInstallation);

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

            this.getUI('cards-container').append(`
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

            controllerCardV = new ControllerCardV({ 
                model: model
            });

            this.showChildView(`card-${ controllerIndex }`, controllerCardV);
        }

        // redirect for fculresta

        let qs = new URLSearchParams(window.location.search);

        if (qs.get('user') && qs.get('user').startsWith('fculresta')) {
            setTimeout(this.redirectToTheFirstInstallation, 0);    
        }

    },

    redirectToTheFirstInstallation: function() {

        let data = Radio.channel('public').request('installations');

        
        if (data && data.length === 0) { return }

        global.location.hash = `#/groups/${data[0].slug}`;
    },

    addNewInstallation: function(ev){

        var addOrEditInstallationV = new AddOrEditInstallationV({

            model: new Backbone.Model,
            onCloseModal: options => {

                this.getUI('new-installation').find('button').removeClass('active')
            }
        });

        Utils.showAsModal(addOrEditInstallationV, 'small');
    }
});

// TODO: create dinamically the number of regions? add a dynamic numer of cards (like a collection view, but not exaclty the same)
//console.log(View.prototype.regions)


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
