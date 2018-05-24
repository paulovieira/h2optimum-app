var $ = require('jquery');
var Q = require('q');
var Backbone = require('backbone');
var _ = require('underscore');
var Radio = require('backbone.radio');

var Utils = require('../_common/utils');

require('./popover')

//require('bootstrap.js');

Utils.resetSingletons();
//debugger

// TO BE DONE: enable long stack traces only in PROD mode
Q.longStackSupport = true;

if (true) {

    Radio.DEBUG = true;
    Q.longStackSupport = true;

    // load raw strings
    //var FindReservationData = require('raw-loader!../_entities/api_hardcoded/FindReservation_9200361.json');

/*
    global.$ = $;
    global._ = _;
    global.Radio = Radio;
    global.Backbone = Backbone;
*/    

}
global.Radio = Radio;
global.$ = $;