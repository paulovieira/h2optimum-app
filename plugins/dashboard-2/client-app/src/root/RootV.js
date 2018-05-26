
var $ = require('jquery');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Q = require('q');
var Leaflet = require('leaflet')
let Flatpickr = require('flatpickr')
let DateFns = require('date-fns');
var Bloodhound = require('typeahead.js/dist/bloodhound.js')
var Typeahead = require('typeahead.js/dist/typeahead.jquery.js')
let _ = require('underscore');
var Utils = require('../_common/utils');
var internals = {};

var View = Mn.View.extend({

    initialize: function(){

        let updateDatePicker = _.debounce(() => { this._updateDatePicker() }, 10);

        this.datepickerM = Radio.channel('collections').request('datepickerM');
        this.listenTo(this.datepickerM, 'change:fromDate change:toDate', updateDatePicker);
    },
   
    ui: {
        'datepicker': 'input[data-id="flatpickr-datepicker"]',
        'datepicker-option': '[data-id="datepicker-select"] > a.dropdown-item',

        'for-main-container': 'div[data-region-id="for-main-container"]',
        'main-search': 'div[data-id="main-search"]',
        'account-menu-item': '[data-id="account-menu-item"]'
    },

    events: {
        'click @ui.datepicker-option': 'setDatepickerFromSelect',
        'click @ui.account-menu-item': 'onClickAccountMenuItem'
    },

    regions: {
        'for-main-container': {
            el: '@ui.for-main-container',
            replaceElement: true
        }
    },

    onAttach: function(){

        this.createDatepicker();

        // update the datepicker so that is has the dates already available in the singleton model
        this._updateDatePicker();


        // todo: call stopReply?

        $('.sidebar-navigation').perfectScrollbar();

        // this is the "app" object defined in 'window' by the 'theadmin' template
        app.isReady();
    },

    onClickAccountMenuItem: function(ev) {

        let itemId = $(ev.currentTarget).attr('data-item-id');

        if (itemId === 'logout') {
            global.location.assign(Host.rootPath + '/Account/LogOff');
            return;
        }

    },

    createDatepicker: function() {

        // see: https://chmln.github.io/flatpickr/instance-methods-properties-elements/

        // the initial dates are set in onAttach (the initial dates are already available in the singleton model)
        this.flatpickr = Flatpickr(this.getUI('datepicker').get(0), {

            mode: 'range',
            //altInput: true,
            //maxDate: hotelDate,
            //minDate: DateFns.subMonths(hotelDate, 24),
            
            onChange: (newDates, dateStr, datepicker) => {

                if (newDates.length !== 2) {
                    return
                }

                // make sure the minimum period has at least 1 day; in this case we force the period to be [date, date+1]
                // (we also have to update the datepicker)
                if (DateFns.isEqual(newDates[0], newDates[1])) {
                    newDates[1] = DateFns.addDays(newDates[1], 1);
                }

                this.datepickerM.set('fromDate', Utils.dateFnsFormat(newDates[0]));
                this.datepickerM.set('toDate', Utils.dateFnsFormat(newDates[1]));
             },
             
             plugins: [
                //new MonthSelectPlugin({ abc: 456 }),
                //new RangePlugin()
            ],

        });
        //window.flatpickr = date.flatpickr;

        /*

        Some notes about the interaction between the datpicker and the respective singleton model

        There are 2 ways to change the dates:

        1) using the datepickerM singleton: Radio.channel('collections').request('period').set('fromDate', ...)

        in this case the following will happen:

        1a) the attributes in the singleton model is updated
        1b) we have a listener for change:fromDate and change:toDate, which calls updateDatePicker
        1c) in updateDatePicker, the API method 'setDate' of the datepicker widget is called (to update the datepicker internally and visually)

        NOTE 1: 'setDate' is called with the 2nd arg false, so the onChange handler (in the datepicker widget) 
        will not be called (otherwise it could lead to recursion)

        NOTE 2: the listener for change:fromDate and change:toDate is a wrapped debounced method; the objective is to be able set these
        attributes separately (one after the other, immediately), but the change listener should only be called once (after both 
        attributes are set)

        2) by using the datepicker widget user interface

        in this case the following will happen:

        2a) the internal logic of the datepicker widget is executed, to updated it internally and visually (the 'change' event is also fired);
        2b) the onChange handler of the datepicker widget is called; in the handler we update the attributes in the singleton model

                datepickerM.set('fromDate', ...)
                datepickerM.set('toDate', ...)

        2c) the listener for change:fromDate and change:toDate is executed; we now are at the same state as in 1b (updateDatePicker is called)
        2d) in updateDatePicker, the API method 'setDate' of the datepicker is called (to update the datepicker internally and visually);
        however since the dates we are giving to setDate are already set in the datepicker (internally and visually), nothing will happen;
        we are also sure that there is no recursion because the 2nd arg to setDate is false

        */

    },

    _updateDatePicker: function (){


        let triggerChangeOnDatepicker = false;
        this.flatpickr.setDate(this.datepickerM.getPeriod(), triggerChangeOnDatepicker);
    },

    setDatepickerFromSelect: function (ev){


        let $el = $(ev.currentTarget);
        let period = $el.data('period');

        let amountToSubtract;

        if (period === 'previous-day') {
            amountToSubtract = 1;
        }
        else if (period === 'previous-3-days') {
            amountToSubtract = 3;
        }
        else if (period === 'previous-week') {
            amountToSubtract = 7;
        }
        else if (period === 'previous-month') {
            amountToSubtract = 30;
        }
        else if (period === 'previous-year') {
            amountToSubtract = 365;
        }

        let toDate = DateFns.startOfToday();
        let fromDate = DateFns.subDays(toDate, amountToSubtract);

        this.datepickerM.set('fromDate', Utils.dateFnsFormat(fromDate));
        this.datepickerM.set('toDate', Utils.dateFnsFormat(toDate));

        /* old - from clever
//debugger
        let $el = $(ev.currentTarget);
        let fromDate = $el.data('from-date'), toDate = $el.data('to-date');
        let hotelDate = Radio.channel('collections').request('hotels').first().get('HotelDate');

        if (fromDate === 'previous-day"') {
            fromDate = DateFns.startOfMonth(hotelDate);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'qtd') {
            fromDate = DateFns.startOfQuarter(hotelDate);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'ytd') {
            fromDate = DateFns.startOfYear(hotelDate);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'last-month') {
            fromDate = DateFns.subMonths(hotelDate, 1);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'last-quarter') {
            fromDate = DateFns.subQuarters(hotelDate, 1);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'last-year') {
            fromDate = DateFns.subYears(hotelDate, 1);
            toDate = DateFns.startOfDay(hotelDate);
        }
        else if (fromDate === 'last-2-years') {
            fromDate = DateFns.subYears(hotelDate, 2);
            toDate = DateFns.startOfDay(hotelDate);
        }

        this.datepickerM.set('fromDate', fromDate);
        this.datepickerM.set('toDate', toDate);
        */
    },

});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
