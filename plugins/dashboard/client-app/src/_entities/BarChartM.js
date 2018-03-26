var Backbone = require('backbone');
var Radio = require('backbone.radio');
var DateFns = require('date-fns');
var _ = require('underscore');
var Q = require('q');
var Utils = require('../_common/utils');

var internals = {};

var BarChartM = Backbone.Model.extend({

    initialize: function(){

        this.summaryDataM = Radio.channel('data').request('summaryDataM');

        if (this.summaryDataM instanceof Backbone.Model === false) {
            throw new Error('The summaryDataM instance does not exist')
        }

        this.listenTo(this.summaryDataM, 'change:current', this.fetch);
    },

    defaults: {
        data: {}
    },

    fetch: function(){

        if (!this.get('dataCode')) {
            throw new Error('dataCode attribute is not defined')
        }

        //debugger
        Q.all([this._fetchCY(), this._fetchLY()])
        .then(response => {

            this.set('dataOriginalCY', response[0].data);
            this.set('dataOriginalLY', response[1].data);

            var data = this.processDataForBritecharts2(response);
            this.set('data', data);
        });
    },

    _fetchCY: function(options){

        var dataRequest = {
            fromDate: DateFns.format(this.summaryDataM.get('current')[0], 'YYYY-MM-DD'),
            toDate: DateFns.format(this.summaryDataM.get('current')[1], 'YYYY-MM-DD'),
            dataCode: this.get('dataCode'),
            dataGroupedBy1: this.get('dataGroupedBy1') || '',
            ConnectionName: Utils.getConfig('connectionName')
        }

        // must be an array of dataRequests
        dataRequest = [dataRequest];

        return Q($.ajax({
            url: '/api/v1/Statistics/GetGenericDataA',
            data: JSON.stringify(dataRequest),
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
        }))
    },

    _fetchLY: function(options){

        var dataRequest = {
            fromDate: DateFns.format(this.summaryDataM.get('currentLY')[0], 'YYYY-MM-DD'),
            toDate: DateFns.format(this.summaryDataM.get('currentLY')[1], 'YYYY-MM-DD'),
            dataCode: this.get('dataCode'),
            dataGroupedBy1: this.get('dataGroupedBy1') || '',
            ConnectionName: Utils.getConfig('connectionName')
        }

        // must be an array of dataRequests
        dataRequest = [dataRequest];

        return Q($.ajax({
            url: '/api/v1/Statistics/GetGenericDataA',
            data: JSON.stringify(dataRequest),
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
        }))
    },

    processDataForBritecharts2: function (response) {

        // see: http://eventbrite.github.io/britecharts/global.html#GroupedBarChartData__anchor
        // https://github.com/eventbrite/britecharts/tree/master/test/json
        var out = {
            data: [
            ]
        };
/*
var out = {
    "data": [
        {
            "stack": "shiny",
            "value": 10,
            "date": "2011-01-06"
        },
        {
            "stack": "shiny",
            "value": 3,
            "date": "2011-01-05"
        },
        {
            "stack": "shiny",
            "value": 16,
            "date": "2011-01-07"
        },
        {
            "stack": "shiny",
            "value": 23,
            "date": "2011-01-08"
        },
        {
            "stack": "radiant",
            "value": 40,
            "date": "2011-01-08"
        },
        {
            "stack": "radiant",
            "value": 23,
            "date": "2011-01-05"
        },
        {
            "stack": "radiant",
            "value": 16,
            "date": "2011-01-06"
        },
        {
            "stack": "radiant",
            "value": 10,
            "date": "2011-01-07"
        },


    ]
}


        return out;
*/
        var startDate = this.summaryDataM.get('fromDate');
        var endDate = this.summaryDataM.get('toDate');

        DateFns.eachDay(startDate, endDate).forEach(d => {

            out.data.push({ 

                dateKey: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                date: DateFns.format(d, 'YYYY-MM-DD'),
                stack: 'CY',
                //group: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                value: undefined
            })

            out.data.push({ 
                dateKey: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                date: DateFns.format(d, 'YYYY-MM-DD'),
                stack: 'LY',
                //group: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                value: undefined
            })
        });


        this.processValuesByGroup(response[0].data, out.data, 'CY');

        // adjust dates from the request to LY, because we want to show the charts as if they were from the same day
        // (the year is not important)
        response[1].data.forEach(obj => {

            // obj.HotelDate will be a string like "2016-08-01 00:00:00"
            var i = 3;
            var year = parseInt(obj.HotelDate.charAt(i), 10);

            obj.HotelDate = obj.HotelDate.substr(0, i) + (year + 1) + obj.HotelDate.substr(i + 1);
        });

        this.processValuesByGroup(response[1].data, out.data, 'LY');

        return out;
    },

    processValuesByGroup: function(serverData, groupedBarData, groupName){

        // TODO: extract the dateToValue processing
        var dateToValue = _.chain(serverData)
                        .groupBy(obj => {

                            return obj.HotelDate;
                        })
                        .mapObject((array, key) => { 
            
                            var total = 0;
                            for (var i = 0; i < array.length; i++) {
                                if (typeof array[i].Value !== 'number') { continue; }
                                total += array[i].Value;
                            }

                            return total;
                        })
                        .value()

        // make sure dates are sorted correctly
        var allDates = serverData.map(obj => obj.HotelDate).sort();  
        allDates = _.unique(allDates);

        allDates.forEach(dateKey => {

            var obj2 = groupedBarData.filter(obj => obj.dateKey === dateKey && obj.stack === groupName)[0]
            if (obj2 === undefined) { return }

            var value = dateToValue[dateKey];
            //if (value === undefined) { return }

            obj2.value = value;
        });

    },

});

module.exports = BarChartM;
