console.log('hello world')


// initial configuration
require('./_config/prerequisites');
require('./_config/overrides');

const Q = require('q');
const $ = require('jquery');
const Backbone = require('backbone');
const Mn = require('backbone.marionette');
const _ = require('underscore');
const Radio = require('backbone.radio');

const CallRouter = require('backbone.call');
//const CallRouter = require('../web_modules/backbone.call');
const Fecha = require('fecha');
const DateFns = require('date-fns');


const Utils = require('./_common/utils');

const Routes = require('./_config/routes');

const internals = {};

internals.main = function(){

    // the type of controller (or "group controller") can be "switch", "sensor", "mixed" or "new"
    Radio.channel('public').reply('controllerGroups', [
        {
            url: '/permalab',
            type: 'switch',
            groupSlug: 'permalab',
            name: 'Permalab',
            description: '&nbsp;',
            statusCode: 1,
            statusMessage: 'on',
            statusMessage2: '(4h23m to finish)',
            diagnosticCode: 0,
            diagnosticMessage: 'ok',
            diagnosticMessage2: 'wefgwe fwef we fwefiowen fiowen fiownefoi weiofnwioe fniowe nfiown fiowfeiow ofi wof wiof owifw nio',
            center: [51.505, -0.09],
            soilType: 'sandy loam',
            cropType: 'corn'

        },
        {
            type: 'mixed',
            groupSlug: 'milho-1',
            name: 'Milho 1',
            description: 'herdade do zambujal - norte',
            statusCode: 0,
            statusMessage: 'off',
            statusMessage2: '&nbsp;',
            diagnosticCode: 1,
            diagnosticMessage: 'problems detected!',
            diagnosticMessage2: '(last measurement was 2 days ago)',
            center: [51.505, -0.09],
            soilType: 'light texture silt loam',
            cropType: 'fruits'

        },
        {
            type: 'mixed',
            groupSlug: 'milho-2',
            name: 'Milho 2',
            description: 'herdade do zambujal - sul',
            statusCode: 0,
            statusMessage: 'off',
            statusMessage2: '&nbsp;',
            diagnosticCode: 2,
            diagnosticMessage: 'requires attention',
            diagnosticMessage2: '&nbsp;',
            center: [51.505, -0.09],
            soilType: 'heavier texture silt loam ',
            cropType: 'wheat'

        },
        {
            type: 'sensor',
            groupSlug: 'pomar',
            name: 'Pomar',
            description: '&nbsp;',
            statusCode: 0,
            statusMessage: 'off',
            statusMessage2: '&nbsp;',
            diagnosticCode: 2,
            diagnosticMessage: 'requires attention',
            diagnosticMessage2: '',
            center: [51.505, -0.09],
            soilType: 'loam',  // fine sand
            cropType: 'grapes'

        }
    ])
    // start with a clean DOM and add the permanent regions (always present)

    Utils.resetDOM();
    Utils.createRootRegion();
    Utils.createModalRegions();

    // create the router and add all the routes

    let router = new CallRouter({
        root: Radio.channel('public').request('rootR')
    });
    
    router.addRoutes(Routes.dashboard);
    router.addRoutes(Routes.group);
    router.addRoutes(Routes.dashboardOneParam);
    router.addRoutes(Routes.dashboardTwoParams);

    router.addRoutes(Routes.empty);
    router.addRoutes(Routes.emptyWithSlash);
    //router.addRoutes(Routes.logout);
    router.addRoutes(Routes.catchAll);


    // finalize the process - get basic information about the hotel and initialize the router
    // (which will show the initial view)

    
    // main starting point; any error thrown in the views will end up in the callback to done
    let p = Q()
    
    // activate the router (start the kiosk app)
    p = p.then(() => {

        $('div[data-id="initial-loading"]').remove();

        router.start({
            hashChange: true,
            //root: "/Bi/"
        });
        
        

    })

    p = p.done(undefined, err => { throw err });


};


internals.main();
/*
*/