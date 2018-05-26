let _ = require('underscore');
let Backbone = require('backbone');
let Radio = require('backbone.radio');
let Utils = require('_common/utils');

let DatepickerM = Backbone.Model.extend({

    initialize: function (){

        // initial period: [HotelDate - N months, HotelDate] (considering the hotelDate of the first hotel)
        this.setInitialPeriod(3);

        // the views should be listening to change:period
        this.on('change:fromDate change:toDate', _.debounce(() => { /*debugger;*/ this.trigger('change:period') }, 10));
    },

    defaults: {
        fromDate: '2000-01-01',
        toDate: '2000-01-01',
    },

    setInitialPeriod: function (numDays) {

        let today = new Date();
        
        let DateFns = require('date-fns');
        this.set('fromDate', Utils.dateFnsFormat(DateFns.subDays(today, numDays)));
        this.set('toDate', Utils.dateFnsFormat(today));
    },

    getPeriod: function (){

        return [this.get('fromDate'), this.get('toDate')];
    }

});

module.exports = DatepickerM;
