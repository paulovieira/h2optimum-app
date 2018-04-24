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
    let p = Q();

    // activate the router (start the kiosk app)
    p = p.then(() => {

        $('div[data-id="initial-loading"]').remove();
        
        router.start({
            hashChange: true,
            //root: "/dashboard/"
        });
    })

    p = p.done(undefined, err => { throw err });

};


internals.main();
/*
*/