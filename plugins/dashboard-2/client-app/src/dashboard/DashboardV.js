let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radiox = require('backbone.radio');
let  Q = require('q');
let ControllerCardV = require('./ControllerCardV')
let NewControllerCardV = require('./NewControllerCardV')

let internals = {};

internals.cropTypes = {
    'crop_corn': 'corn description',
    'crop_fruits': 'fruits description',
    'crop_wheat': 'wheat description',
    'crop_grapes': 'grapes description',
    'crop_type_x': 'crop type X description',
    'crop_type_y': 'crop type Y description',
    'crop_type_z': 'crop type Z description',
};

internals.soilTypes = {
    'soil_loam': 'loam',
    'soil_sandy_loam': 'sandy loam',
    'soil_light_texture_silt_loam': 'light texture silt loam',
    'soil_heavier_texture_silt_loam': 'heavier texture silt loam',
    'soil_fine_sand': 'fine sand',
    'soil_type_x': 'soil type X description',
    'soil_type_y': 'soil type Y description',
    'soil_type_z': 'soil type Z description',
};



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
        'main-content': 'div.main-content'
    },

    regions: {
        'footer': '@ui.footer',
    },

    fetchAndRender: function(){

        this.fetchData()
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

        let p = Q($.ajax({
            url: '/api/get-installations',
            type: 'GET',
            data: {},
        }));


    /*
            active:         true
                cropTypeCode:         "crop_corn"
                description:         "desc"
                id:         5
                location:         {}
                name:         "my installation xyz"
                slug:         "my-installation-xyz-442f"
                soilTypeCode:         "soil_loam"
            userId:         2
    */

    /*
            // the type of controller (or "group controller") can be "switch", "sensor", "mixed" or "new"
            let dummyInstallations = [
                {
                        id: 1,
                    type: 'switch',
                        slug: 'permalab',
                        name: 'Permalab',
                        description: '&nbsp;',
                    statusCode: 1,
                    statusMessage: 'on',
                    statusMessage2: '(4h23m to finish)',
                    diagnosticCode: 0,
                    diagnosticMessage: 'ok',
                    diagnosticMessage2: 'wefgwe fwef we fwefiowen fiowen fiownefoi weiofnwioe fniowe nfiown fiowfeiow ofi wof wiof owifw nio',
                    center: [51.505, -0.09],
                        soilTypeCode: 'soil_sandy_loam',
                        cropTypeCode: 'crop_corn'

                },
            ];
    */


        p = p.then(installations => {
            
            installations.forEach(obj => {

                obj.cropTypeDesc = internals.cropTypes[obj.cropTypeCode];
                obj.soilTypeDesc = internals.soilTypes[obj.soilTypeCode];
            })


            var newController = [{
                type: 'new',
                name: 'New installation',
                description: 'Click to add a new installation',
            }]

            installations = installations.concat(newController);

            // TODO: location is location
            installations.forEach(obj => { obj.location = [51.505, -0.09] })

            Radio.channel('public').reply('installations', installations);


        })

//        p = p.done(undefined, err => { debugger; throw err });

        return p;

    }
});

// TODO: create dinamically the number of regions? add a dynamic numer of cards (like a collection view, but not exaclty the same)
//console.log(View.prototype.regions)


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
