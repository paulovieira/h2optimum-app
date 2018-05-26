let $ = require('jquery');

let _ = require('underscore');
let Radio = require('backbone.radio');
let DateFns = require('date-fns');
let Q = require('q');
//let Utils = require('../_xcommon/utils')
let Utils = require('_common/utils')


let internals = {};
internals.singletonsAreCreated = false;

exports.createSingletons = function () {

    if (internals.singletonsAreCreated) { return }

    internals.createSingletonPeriod();

    internals.singletonsAreCreated = true;
};

internals.createSingletonPeriod = function () {

    let DatepickerM = require('_entities/DatepickerM')

    // create a Backbone collection from the raw data
    Radio.channel('collections').reply('datepickerM', new DatepickerM);
    //window.datepickerM = Radio.channel('collections').request('datepickerM');
}


