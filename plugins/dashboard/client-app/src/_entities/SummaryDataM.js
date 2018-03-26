var Backbone = require('backbone');
var Radio = require('backbone.radio');
var DateFns = require('date-fns');
var Q = require('q');
var Utils = require('../_common/utils');

var internals = {};

internals.fetch = function(options){

    if (!Array.isArray(options)) {
        options = [options];
    }

    options.forEach(obj => {

        //obj.ConnectionName = Utils.getConfig('connectionName');
        obj.fromDate = DateFns.format(obj.fromDate, 'YYYY-MM-DD');
        obj.toDate = DateFns.format(obj.toDate, 'YYYY-MM-DD');
    })

    return Q($.ajax({
        url: '/api/v1/Statistics/GetGenericDataA',
        //data: JSON.stringify(options),
        data: JSON.stringify({
            connectionName: Utils.getConfig('connectionName'),
            dataRequests: options
        }),
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
    }))
};

var SummaryM = Backbone.Model.extend({

    initialize: function(){

        // the main change that triggers all the other changes is when
        // we do model.set('current', [fromDate, toDate]); 
        // we then update the corresponding flat properties: fromDate and toDate,
        // and the rest of the changes then follows from that;

        this.on('change:current', this.setFromDateAndToDate)
        this.on('change:current', this.setCurrentLYPeriod)
        this.on('change:current', this.fetch)

        this.on('change:fromDate', this.setFromDateFormatted);
        this.on('change:toDate', this.setToDateFormatted);

        //this.on('change:fromDate', this.setCurrentPeriod);
        //this.on('change:toDate', this.setCurrentPeriod);

        this.on('change:toDate', this.setDatePeriod);
        this.on('change:toDate', this.setDatePreviousPeriod);
        this.on('change:toDate', this.setMTDPeriod);
        this.on('change:toDate', this.setYTDPeriod);

        this.on('change:toDate', this.setDateLYPeriod);
        this.on('change:toDate', this.setDatePreviousLYPeriod);
        this.on('change:toDate', this.setMTDLYPeriod);
        this.on('change:toDate', this.setYTDLYPeriod);

        [
            'adr',
            'revpar',
            'occ',
            'revenue',
            'roomnights'
        ].forEach(metric => {

            [
                'date',
                'datePrevious',
                'mtd',
                'ytd',
                'current',

                'dateLY',
                'datePreviousLY',
                'mtdLY',
                'ytdLY',
                'currentLY'
            ].forEach(period => {

                var eventName = 'change:' + metric + '_' + period;
                this.on(eventName, this.setVariation);
            })
        })
       
    },


    /*

    suppose the currently selected dates are [2017-08-05, 2017-08-17]

    the periods are then defined as:

    current: [2017-08-05, 2017-08-17],

    date: [2017-08-17, 2017-08-17],
    datePrevious: [2017-08-16, 2017-08-16],
    mtd: [2017-08-01, 2017-08-17],  (from the 1st day of the month of the toDate until toDate)
    ytd: [2017-01-01, 2017-08-17],  (1st day of the year of the toDate until toDate)

    dateLY: [2016-08-17, 2016-08-17],
    datePreviousLY: [2016-08-16, 2016-08-16],
    mtdLY: [2016-08-01, 2016-08-17],
    ytdLY: [2016-01-01, 2016-08-17],

    */


    defaults: {

        fromDate: undefined,
        fromDateFormatted: '',
        toDate:  undefined,
        toDateFormatted: '' ,

        // current periods (defined by the current fromDate and toDate)
        current: [],
        currentLY: [],

        // reference periods (defined only by the current toDate - see above for an explanation)
        date: [],
        datePrevious: [],
        mtd: [],
        ytd: [],

        dateLY: [],
        datePreviousLY: [],
        mtdLY: [],
        ytdLY: [],

        // properties with the values for each period, for the different metrics

        // Occupancy

        occ_date: undefined,
        occ_datePrevious: undefined,
        occ_mtd: undefined,
        occ_ytd: undefined,
        occ_current: undefined,

        occ_dateLY: undefined,
        occ_datePreviousLY: undefined,
        occ_mtdLY: undefined,
        occ_ytdLY: undefined,
        occ_currentLY: undefined,

        occ_variation_date_datePrevious: undefined,
        occ_variation_date_dateLY: undefined,
        occ_variation_mtd_mtdLY: undefined,
        occ_variation_ytd_ytdLY: undefined,


        // RevPar

        revpar_date: undefined,
        revpar_datePrevious: undefined,
        revpar_mtd: undefined,
        revpar_ytd: undefined,
        revpar_current: undefined,

        revpar_dateLY: undefined,
        revpar_datePreviousLY: undefined,
        revpar_mtdLY: undefined,
        revpar_ytdLY: undefined,
        revpar_currentLY: undefined,

        revpar_variation_date_datePrevious: undefined,
        revpar_variation_date_dateLY: undefined,
        revpar_variation_mtd_mtdLY: undefined,
        revpar_variation_ytd_ytdLY: undefined,


        // ADR

        adr_date: undefined,
        adr_datePrevious: undefined,
        adr_mtd: undefined,
        adr_ytd: undefined,
        adr_current: undefined,

        adr_dateLY: undefined,
        adr_datePreviousLY: undefined,
        adr_mtdLY: undefined,
        adr_ytdLY: undefined,
        adr_currentLY: undefined,

        adr_variation_date_datePrevious: undefined,
        adr_variation_date_dateLY: undefined,
        adr_variation_mtd_mtdLY: undefined,
        adr_variation_ytd_ytdLY: undefined,


        // REVENUE
        
        revenue_date: undefined,
        revenue_datePrevious: undefined,
        revenue_mtd: undefined,
        revenue_ytd: undefined,
        revenue_current: undefined,

        revenue_dateLY: undefined,
        revenue_datePreviousLY: undefined,
        revenue_mtdLY: undefined,
        revenue_ytdLY: undefined,
        revenue_currentLY: undefined,

        revenue_variation_date_datePrevious: undefined,
        revenue_variation_date_dateLY: undefined,
        revenue_variation_mtd_mtdLY: undefined,
        revenue_variation_ytd_ytdLY: undefined,


        // ROOMNIGHTS

        roomnights_date: undefined,
        roomnights_datePrevious: undefined,
        roomnights_mtd: undefined,
        roomnights_ytd: undefined,
        roomnights_current: undefined,

        roomnights_dateLY: undefined,
        roomnights_datePreviousLY: undefined,
        roomnights_mtdLY: undefined,
        roomnights_ytdLY: undefined,
        roomnights_currentLY: undefined,

        roomnights_variation_date_datePrevious: undefined,
        roomnights_variation_date_dateLY: undefined,
        roomnights_variation_mtd_mtdLY: undefined,
        roomnights_variation_ytd_ytdLY: undefined,

    },

    setFromDateAndToDate: function(model, current) {

        this.set('fromDate', current[0]);
        this.set('toDate', current[1]);
    },
/*
    setFormattedDate: function(model, date) {

        // use a valid date format from DateFns - https://date-fns.org/v1.28.5/docs/format
        var formats = [
            'YYYY-MM-DD',
            'D/MMM/YY'
        ];

        var dateFormatted = {};
        formats.forEach(format => {

            dateFormatted[format] = DateFns.format(date, format);
        });

        var attr = model.changed.fromDate !== undefined ? 'fromDateFormatted' : 'toDateFormatted';
        model.set(attr, dateFormatted);
    },
    */

    setFromDateFormatted: function(model, date) {
//debugger
        model.set('fromDateFormatted', this.computeDateFormatted(date));
    },

    setToDateFormatted: function(model, date) {
//debugger
        model.set('toDateFormatted', this.computeDateFormatted(date));
    },

    computeDateFormatted: function(date) {

        // use a valid date format from DateFns - https://date-fns.org/v1.28.5/docs/format
        var formats = [
            'YYYY-MM-DD',
            'D/MMM/YY'
        ];

        var dateFormatted = {};
        formats.forEach(format => {

            dateFormatted[format] = DateFns.format(date, format);
        });

        return dateFormatted;
    },

    setCurrentLYPeriod: function(model, current) {

        var _fromDate = current[0];
        var _toDate = current[1];
        model.set('currentLY', [DateFns.subYears(_fromDate, 1), DateFns.subYears(_toDate, 1)]);
    },

    setDatePeriod: function(model, toDate) {

        var _date = toDate;
        model.set('date', [_date, _date]);
    },

    setDatePreviousPeriod: function(model, toDate) {

        var _datePrevious = DateFns.subDays(toDate, 1);
        model.set('datePrevious', [_datePrevious, _datePrevious]);
    },

    setMTDPeriod: function(model, toDate) {

        var _date = toDate;
        var _firstDayOfMonth = DateFns.startOfMonth(_date);
        model.set('mtd', [_firstDayOfMonth, _date]);
    },

    setYTDPeriod: function(model, toDate) {

        var _date = toDate;
        var _firstDayOfYear = DateFns.startOfYear(_date);
        model.set('ytd', [_firstDayOfYear, _date]);
    },

    setDateLYPeriod: function(model, toDate) {

        var _date = toDate;
        model.set('dateLY', [DateFns.subYears(_date, 1), DateFns.subYears(_date, 1)]);
    },

    setDatePreviousLYPeriod: function(model, toDate) {

        var _datePrevious = DateFns.subDays(toDate, 1);
        model.set('datePreviousLY', [DateFns.subYears(_datePrevious, 1), DateFns.subYears(_datePrevious, 1)]);
    },

    setMTDLYPeriod: function(model, toDate) {

        var _date = toDate;
        var _firstDayOfMonth = DateFns.startOfMonth(_date);
        model.set('mtdLY', [DateFns.subYears(_firstDayOfMonth, 1), DateFns.subYears(_date, 1)]);
    },

    setYTDLYPeriod: function(model, toDate) {

        var _date = toDate;
        var _firstDayOfYear = DateFns.startOfYear(_date);
        model.set('ytdLY', [DateFns.subYears(_firstDayOfYear, 1), DateFns.subYears(_date, 1)]);
    },

    processSummaryData: function (response) {

        return response.data.map(obj => obj.Value);
    },

    fetch: function(){

        var dataRequest = [

            // OCC

            {
                fromDate: this.get('date')[0],
                toDate: this.get('date')[1],
                dataCode: 'OCC_INTERVAL', 
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePrevious')[0],
                toDate: this.get('datePrevious')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtd')[0],
                toDate: this.get('mtd')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytd')[0],
                toDate: this.get('ytd')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('current')[0],
                toDate: this.get('current')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },

            // OCC LY

            {
                fromDate: this.get('dateLY')[0],
                toDate: this.get('dateLY')[1],
                dataCode: 'OCC_INTERVAL', 
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePreviousLY')[0],
                toDate: this.get('datePreviousLY')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },

            {
                fromDate: this.get('mtdLY')[0],
                toDate: this.get('mtdLY')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytdLY')[0],
                toDate: this.get('ytdLY')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('currentLY')[0],
                toDate: this.get('currentLY')[1],
                dataCode: 'OCC_INTERVAL',
                dataGroupedBy1: ''
            },

            // REVPAR

            {
                fromDate: this.get('date')[0],
                toDate: this.get('date')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePrevious')[0],
                toDate: this.get('datePrevious')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtd')[0],
                toDate: this.get('mtd')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytd')[0],
                toDate: this.get('ytd')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('current')[0],
                toDate: this.get('current')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },

            // REVPAR LY

            {
                fromDate: this.get('dateLY')[0],
                toDate: this.get('dateLY')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },            
            {
                fromDate: this.get('datePreviousLY')[0],
                toDate: this.get('datePreviousLY')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtdLY')[0],
                toDate: this.get('mtdLY')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytdLY')[0],
                toDate: this.get('ytdLY')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('currentLY')[0],
                toDate: this.get('currentLY')[1],
                dataCode: 'REVPAR_INTERVAL',
                dataGroupedBy1: ''
            },

            // ADR

            {
                fromDate: this.get('date')[0],
                toDate: this.get('date')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePrevious')[0],
                toDate: this.get('datePrevious')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtd')[0],
                toDate: this.get('mtd')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytd')[0],
                toDate: this.get('ytd')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('current')[0],
                toDate: this.get('current')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },

            // ADR LY

            {
                fromDate: this.get('dateLY')[0],
                toDate: this.get('dateLY')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePreviousLY')[0],
                toDate: this.get('datePreviousLY')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtdLY')[0],
                toDate: this.get('mtdLY')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytdLY')[0],
                toDate: this.get('ytdLY')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('currentLY')[0],
                toDate: this.get('currentLY')[1],
                dataCode: 'ADR_INTERVAL',
                dataGroupedBy1: ''
            },

            // REVENUE

            {
                fromDate: this.get('date')[0],
                toDate: this.get('date')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePrevious')[0],
                toDate: this.get('datePrevious')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtd')[0],
                toDate: this.get('mtd')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytd')[0],
                toDate: this.get('ytd')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('current')[0],
                toDate: this.get('current')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },

            // REVENUE LY

            {
                fromDate: this.get('dateLY')[0],
                toDate: this.get('dateLY')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePreviousLY')[0],
                toDate: this.get('datePreviousLY')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtdLY')[0],
                toDate: this.get('mtdLY')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytdLY')[0],
                toDate: this.get('ytdLY')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('currentLY')[0],
                toDate: this.get('currentLY')[1],
                dataCode: 'REVENUE_INTERVAL',
                dataGroupedBy1: ''
            },


            // ROOMNIGHTS

            {
                fromDate: this.get('date')[0],
                toDate: this.get('date')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePrevious')[0],
                toDate: this.get('datePrevious')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtd')[0],
                toDate: this.get('mtd')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytd')[0],
                toDate: this.get('ytd')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('current')[0],
                toDate: this.get('current')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },

            // ROOMNIGHTS LY

            {
                fromDate: this.get('dateLY')[0],
                toDate: this.get('dateLY')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('datePreviousLY')[0],
                toDate: this.get('datePreviousLY')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('mtdLY')[0],
                toDate: this.get('mtdLY')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('ytdLY')[0],
                toDate: this.get('ytdLY')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            },
            {
                fromDate: this.get('currentLY')[0],
                toDate: this.get('currentLY')[1],
                dataCode: 'ROOMNIGHTS_INTERVAL',
                dataGroupedBy1: ''
            }

        ];

// TODO: use instead a "batch change": this.set({ occDate: '...', occDatePrevious: '...', etc}) ?

        this.set('occ_date', '...');
        this.set('occ_datePrevious', '...');
        this.set('occ_mtd', '...');
        this.set('occ_ytd', '...');
        this.set('occ_current', '...');

        this.set('occ_dateLY', '...');
        this.set('occ_datePreviousLY', '...');
        this.set('occ_mtdLY', '...');
        this.set('occ_ytdLY', '...');
        this.set('occ_currentLY', '...');

        this.set('revpar_date', '...');
        this.set('revpar_datePrevious', '...');
        this.set('revpar_mtd', '...');
        this.set('revpar_ytd', '...');
        this.set('revpar_current', '...');

        this.set('revpar_dateLY', '...');
        this.set('revpar_datePreviousLY', '...');
        this.set('revpar_mtdLY', '...');
        this.set('revpar_ytdLY', '...');
        this.set('revpar_currentLY', '...');

        this.set('adr_date', '...');
        this.set('adr_datePrevious', '...');
        this.set('adr_mtd', '...');
        this.set('adr_ytd', '...');
        this.set('adr_current', '...');

        this.set('adr_dateLY', '...');
        this.set('adr_datePreviousLY', '...');
        this.set('adr_mtdLY', '...');
        this.set('adr_ytdLY', '...');
        this.set('adr_currentLY', '...');

        this.set('revenue_date', '...');
        this.set('revenue_datePrevious', '...');
        this.set('revenue_mtd', '...');
        this.set('revenue_ytd', '...');
        this.set('revenue_current', '...');

        this.set('revenue_dateLY', '...');
        this.set('revenue_datePreviousLY', '...');
        this.set('revenue_mtdLY', '...');
        this.set('revenue_ytdLY', '...');
        this.set('revenue_currentLY', '...');

        this.set('roomnights_date', '...');
        this.set('roomnights_datePrevious', '...');
        this.set('roomnights_mtd', '...');
        this.set('roomnights_ytd', '...');
        this.set('roomnights_current', '...');

        this.set('roomnights_dateLY', '...');
        this.set('roomnights_datePreviousLY', '...');
        this.set('roomnights_mtdLY', '...');
        this.set('roomnights_ytdLY', '...');
        this.set('roomnights_currentLY', '...');

        Q(internals.fetch(dataRequest))
        .then(response => {

            if(response.success === false) {
                alert('error fetching data')
                return;
            }

            var value = this.processSummaryData(response);

            var i = 0;

            this.set('occ_date', value[i++]);
            this.set('occ_datePrevious', value[i++]);
            this.set('occ_mtd', value[i++]);
            this.set('occ_ytd', value[i++]);
            this.set('occ_current', value[i++]);

            this.set('occ_dateLY', value[i++]);
            this.set('occ_datePreviousLY', value[i++]);
            this.set('occ_mtdLY', value[i++]);
            this.set('occ_ytdLY', value[i++]);
            this.set('occ_currentLY', value[i++]);

            this.set('revpar_date', value[i++]);
            this.set('revpar_datePrevious', value[i++]);
            this.set('revpar_mtd', value[i++]);
            this.set('revpar_ytd', value[i++]);
            this.set('revpar_current', value[i++]);

            this.set('revpar_dateLY', value[i++]);
            this.set('revpar_datePreviousLY', value[i++]);
            this.set('revpar_mtdLY', value[i++]);
            this.set('revpar_ytdLY', value[i++]);
            this.set('revpar_currentLY', value[i++]);

            this.set('adr_date', value[i++]);
            this.set('adr_datePrevious', value[i++]);
            this.set('adr_mtd', value[i++]);
            this.set('adr_ytd', value[i++]);
            this.set('adr_current', value[i++]);

            this.set('adr_dateLY', value[i++]);
            this.set('adr_datePreviousLY', value[i++]);
            this.set('adr_mtdLY', value[i++]);
            this.set('adr_ytdLY', value[i++]);
            this.set('adr_currentLY', value[i++]);

            this.set('revenue_date', value[i++]);
            this.set('revenue_datePrevious', value[i++]);
            this.set('revenue_mtd', value[i++]);
            this.set('revenue_ytd', value[i++]);
            this.set('revenue_current', value[i++]);

            this.set('revenue_dateLY', value[i++]);
            this.set('revenue_datePreviousLY', value[i++]);
            this.set('revenue_mtdLY', value[i++]);
            this.set('revenue_ytdLY', value[i++]);
            this.set('revenue_currentLY', value[i++]);

            this.set('roomnights_date', value[i++]);
            this.set('roomnights_datePrevious', value[i++]);
            this.set('roomnights_mtd', value[i++]);
            this.set('roomnights_ytd', value[i++]);
            this.set('roomnights_current', value[i++]);

            this.set('roomnights_dateLY', value[i++]);
            this.set('roomnights_datePreviousLY', value[i++]);
            this.set('roomnights_mtdLY', value[i++]);
            this.set('roomnights_ytdLY', value[i++]);
            this.set('roomnights_currentLY', value[i++]);

        })
        .catch(err => {
            debugger
        })
    },

//TODO: 
//-fazer 1 só .set

    setVariation: function() {
        
        var changedAttrs = Object.keys(this.changed);
        if (changedAttrs.length !== 1) { return }

        var metric = (changedAttrs[0]).split('_')[0];
        var variationType = (metric === 'occ') ? 'percentagePoints' : 'percentage';

        var value_date = this.get(metric + '_date');
        var value_datePrevious = this.get(metric + '_datePrevious');
        var value_mtd = this.get(metric + '_mtd');
        var value_ytd = this.get(metric + '_ytd');

        var value_dateLY = this.get(metric + '_dateLY');
        var value_datePreviousLY = this.get(metric + '_datePreviousLY');
        var value_mtdLY = this.get(metric + '_mtdLY');
        var value_ytdLY = this.get(metric + '_ytdLY');

        if (typeof value_date === 'number' && typeof value_datePrevious === 'number') {
            this.set(metric + '_variation_date_datePrevious', this.computeVariation(value_datePrevious, value_date, variationType));
        }

        if (typeof value_date === 'number' && typeof value_dateLY === 'number') {
            this.set(metric + '_variation_date_dateLY', this.computeVariation(value_dateLY, value_date, variationType));
        }

        if (typeof value_mtd === 'number' && typeof value_mtdLY === 'number') {
            this.set(metric + '_variation_mtd_mtdLY', this.computeVariation(value_mtdLY, value_mtd, variationType));
        }

        if (typeof value_ytd === 'number' && typeof value_ytdLY === 'number') {
            this.set(metric + '_variation_ytd_ytdLY', this.computeVariation(value_ytdLY, value_ytd, variationType));
        }

    },

    computeVariation: function (before, after, variationType) {

        variationType = variationType || 'percentage'

        if (variationType === 'percentage') {
            return this.computeVariationInPercentage(before, after);
        }
        else if (variationType === 'percentagePoints') {
            return this.computeVariationInPercentagePoints(before, after);
        }
        else {
            throw new Error('computeVariation: unknown variationType', variationType)
        }
    },

    computeVariationInPercentage: function(before, after){

        var variation = 0;

        if (before === 0 && after !== 0) {
            var signal = after / Math.abs(after);
            variation = signal * 100;
        }
        else {
            variation = ((after - before) / before ) * 100;
        }

        return variation;
    },

    computeVariationInPercentagePoints: function(before, after){

        var variation = after - before;

        return variation;
    },



});

module.exports = SummaryM;
