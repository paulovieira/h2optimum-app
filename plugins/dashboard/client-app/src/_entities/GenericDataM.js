var Backbone = require('backbone');
var Radio = require('backbone.radio');
var DateFns = require('date-fns');
var _ = require('underscore');
var Q = require('q');
var Utils = require('../_common/utils');
var BillboardHelpers = require('./BillboardHelpers')

var internals = {};

var GenericDataM = Backbone.Model.extend({

    initialize: function(){

        this.summaryDataM = Radio.channel('data').request('summaryDataM');

        if (this.summaryDataM instanceof Backbone.Model === false) {
            throw new Error('The summaryDataM instance does not exist')
        }

        if (this.get('hardcoded') === undefined) {
            this.listenTo(this.summaryDataM, 'change:current', this.fetch);    
        }
        
    },

    defaults: {
        dataOriginalCY: null,
        dataOriginalLY: null,
        dataCY: null,
        dataLY: null,
        dataBillboard: null,
        dataBritecharts: null,
        dataMetrics: null
    },

    fetch: function(){

        if (!this.get('dataCode')) {
            throw new Error('dataCode attribute is not defined')
        }

        //debugger
        Q.all([this._fetch('current'), this._fetch('currentLY')])
        .then(response => {

            this.set('dataOriginalCY', response[0].data);
            this.set('dataOriginalLY', response[1].data);

            this.set('dataCY', this.fillMissingDatesWithNull(response[0].data, 'current'));
            this.set('dataLY', this.fillMissingDatesWithNull(response[1].data, 'currentLY'));
            
            this.incrementYear();

            if(this.get('billboard')){
                this.set('dataBillboard', BillboardHelpers.processData(this.get('dataCY'), this.get('dataLY')));    
            }
            else if(this.get('britecharts')){
                //this.set('dataBritecharts', this.processDataForBritecharts());       
            }
            
        });
    },

    _fetch: function(periodAttr){

        var dataRequest = {
            fromDate: DateFns.format(this.summaryDataM.get(periodAttr)[0], 'YYYY-MM-DD'),
            toDate: DateFns.format(this.summaryDataM.get(periodAttr)[1], 'YYYY-MM-DD'),
            dataCode: this.get('dataCode'),
            dataGroupedBy1: this.get('dataGroupedBy1') || '',
            //ConnectionName: Utils.getConfig('connectionName')
        }

        var data = {
            connectionName: Utils.getConfig('connectionName'),
            dataRequests: [dataRequest]
        }

        // GetGenericDataA expects an array of dataRequests

        return Q($.ajax({
            url: '/api/v1/Statistics/GetGenericDataA',
            data: JSON.stringify(data),
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
        }))
    },

    fillMissingDatesWithNull: function(array, periodAttr){

        var startDate = this.summaryDataM.get(periodAttr)[0];
        var endDate = this.summaryDataM.get(periodAttr)[1];

        var output = DateFns.eachDay(startDate, endDate).map(function(d) {

            return {
                HotelDate: DateFns.format(d, 'YYYY-MM-DD'),
                CompanyId: null,
                DataCode: null,
                DataGroupBy: null,
                DataPointCode: null,
                DataPointDescription: null,
                DataPointOrder: null,
                HotelCode: null,
                RowNumber: null,
                Value: null,
                ValueFormatDecimalPlaces: null
            };
        });

        output.forEach(obj => {

            var obj3 = array.filter(obj2 => DateFns.format(obj2.HotelDate, 'YYYY-MM-DD') === obj.HotelDate)[0]
            if (obj3 === undefined) { return }

            //obj.HotelDate = obj3.HotelDate;
            obj.CompanyId = obj3.CompanyId;
            obj.DataCode = obj3.DataCode;
            obj.DataGroupBy = obj3.DataGroupBy;
            obj.DataPointCode = obj3.DataPointCode;
            obj.DataPointDescription = obj3.DataPointDescription;
            obj.DataPointOrder = obj3.DataPointOrder;
            obj.HotelCode = obj3.HotelCode;
            obj.RowNumber = obj3.RowNumber;
            obj.Value = obj3.Value;
            obj.ValueFormatDecimalPlaces = obj3.ValueFormatDecimalPlaces;
        });

        return output;
    },

    incrementYear: function() {

        // adjust the year in the data relative to LY because we want to show the charts as if each point was from the same day
        // (that is, the year is not important)

        this.get('dataLY').forEach(obj => {

            // obj.HotelDate will be a string like "2016-08-01"; we want "2017-08-01" instead
            obj.HotelDateOriginal = obj.HotelDate;
            
            var i = 3;
            var year = parseInt(obj.HotelDate.charAt(i), 10);

            obj.HotelDate = obj.HotelDate.substr(0, i) + (year + 1) + obj.HotelDate.substr(i + 1);
        });

    },
















// FROM HERE BELOW - TO BE REMOVED
    processDataForBritecharts2: function (response) {

        //var data = response[0].data

        // see: http://eventbrite.github.io/britecharts/global.html#LineChartData__anchor
        // https://github.com/eventbrite/britecharts/tree/master/test/json
        var out = {
            dataByTopic: [
                {
                    topic: 0,
                    topicName: 'CY',
                    total: 0,
                    totalFormatted: '',
                    dates: []
                },
                {
                    topic: 1,
                    topicName: 'LY',
                    total: 0,
                    totalFormatted: '',
                    dates: []
                }, 
            ],

            //dataByDate: [
            //]

        }

        
        var startDate = this.summaryDataM.get('fromDate');
        var endDate = this.summaryDataM.get('toDate')

        DateFns.eachDay(startDate, endDate).forEach(d => {

            out.dataByTopic[0].dates.push({ 
                date: d, 
                dateKey: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                dateFormatted: DateFns.format(d, 'dddd, D/MMMM/YYYY'), 
                //value: undefined,
                value: 0  // default value
            });

            out.dataByTopic[1].dates.push({ 
                date: d, 
                dateKey: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                dateFormatted: DateFns.format(d, 'dddd, D/MMMM/YYYY'), 
                //value: undefined,
                value: 0  // default value
            });
/*
            out.dataByDate.push({ 
                date: d,
                dateKey: DateFns.format(d, 'YYYY-MM-DD HH:mm:ss'),
                topics: [
                    {
                        name: 0,
                        topicName: 'CY2', // does it have to be the same of in out.dataByTopic?
                        value: undefined,
                    },
                    {
                        name: 1,
                        topicName: 'LY2',
                        value: undefined,
                    }
                ] 
            })
*/
        });


        this.processValuesByTopic(response[0].data, out.dataByTopic[0]);
/*
        this.processValuesByDate(response[0].data, 0, out.dataByDate);
*/


        this.processValuesByTopic(response[1].data, out.dataByTopic[1]);
/*
        this.processValuesByDate(response[1].data, 1, out.dataByDate);
*/
        return out;
    },

    processValuesByTopic: function(data, topic){

        // TODO: extract the dateToValue processing
        var dateToValue = _.chain(data)
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
        var allDates = data.map(obj => obj.HotelDate).sort();  
        allDates = _.unique(allDates);

        allDates.forEach(dateKey => {

            var obj2 = topic.dates.filter(obj => obj.dateKey === dateKey)[0]
            if (obj2 === undefined) { return }

            var value = dateToValue[dateKey];
            //if (value === undefined) { return }

            obj2.value = value;
        });

        this.processTotalByTopic(topic);
    },

    processTotalByTopic: function(topic){

        topic.total = 0;

        topic.dates.forEach(obj => {

            if (typeof obj.value !== 'number') { return }

            topic.total += obj.value;
        });

        topic.totalFormatted = Utils.getFormattedNumber(topic.total, 'money', 2);
    },



/*
    processValuesByDate: function(data, topicName, dataByDate) {

        var dateToValue = _.chain(data)
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
        var allDates = data.map(obj => obj.HotelDate).sort();  
        allDates = _.unique(allDates);

        allDates.forEach(dateKey => {

            var obj2 = dataByDate.filter(obj => obj.dateKey === dateKey)[0]
            if (obj2 === undefined) { return }

            var obj3 = obj2.topics.filter(obj => obj.name === topicName)[0]
            if (obj3 === undefined) { return }

            var value = dateToValue[dateKey];
            //if (value === undefined) { return }

            obj3.value = value;
        });
    },
*/


});

module.exports = GenericDataM;
