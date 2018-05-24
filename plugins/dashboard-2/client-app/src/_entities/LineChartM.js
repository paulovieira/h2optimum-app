var Backbone = require('backbone');
var Radio = require('backbone.radio');
var DateFns = require('date-fns');
var _ = require('underscore');
var Q = require('q');
var Utils = require('../_common/utils');

var internals = {};

var LineChartM = Backbone.Model.extend({

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
debugger
            this.set('dataCY', this.fillMissingDatesWithNull(response[0].data));
            this.set('dataOriginalLY', response[1].data);
            this.set('dataLY', this.fillMissingDatesWithNull(response[1].data));

            
            this.incrementYear(response[1].data);

            this.set('dataBritecharts', this.processDataForBritecharts2(response));
            this.set('dataBillboard', this.processDataForBillboard(response));
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

    fillMissingDatesWithNull: function(array){

        var startDate = this.summaryDataM.get('fromDate');
        var endDate = this.summaryDataM.get('toDate');
debugger
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

            var obj2 = array.filter(obj => obj.dateKey === dateKey)[0]
            if (obj2 === undefined) { return }

            var value = dateToValue[dateKey];
            //if (value === undefined) { return }

            obj2.value = value;
        });

        return output;
return
        DateFns.eachDay(startDate, endDate).forEach(d => {

debugger
            var x = DateFns.format(d, 'YYYY-MM-DD');
            var dateStr = DateFns.format(d, 'YYYY-MM-DD') + ' 00:00:00';  // the server will always send 00:00:00 ?
            var obj2 = array.filter(obj => obj.HotelDate === dateStr)[0]
            if (obj2 === undefined) { return }

            var value = dateToValue[dateKey];
            //if (value === undefined) { return }

            obj2.value = value;


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

        });

    },

    incrementYear: function(array) {

        // adjust dates from the request to LY because we want to show the charts as if each point was from the same day
        // (that is, the year is not important)
        array.data.forEach(obj => {

            // obj.HotelDate will be a string like "2016-08-01 00:00:00"
            obj.HotelDateOriginal = obj.HotelDate;
            
            var i = 3;
            var year = parseInt(obj.HotelDate.charAt(i), 10);

            obj.HotelDate = obj.HotelDate.substr(0, i) + (year + 1) + obj.HotelDate.substr(i + 1);
        });
    },

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
/*
            dataByDate: [
            ]
*/
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

    processDataForBillboard: function (response) {

        var ts = ['ts'], tsGrid = [];
        var CY = ['CY'];
        var LY = ['LY'];

        response[0].forEach(obj => { CY.push(obj.Value) })
        response[1].forEach(obj => { LY.push(obj.Value) })

        var startDate = this.summaryDataM.get('fromDate');
        var endDate = this.summaryDataM.get('toDate');

        var allDays = []
        DateFns.eachDay(startDate, endDate).forEach(d => {

            ts.push(DateFns.format(d, 'YYYY-MM-DD'))
            allDays.push(DateFns.format(d, 'YYYY-MM-DD'))
        });




        this.model.get('data').dataByTopic[0].dates.forEach(obj => { CY.push(obj.value) })
        this.model.get('data').dataByTopic[0].dates.forEach(obj => { CYNulls.push(null) })

        this.model.get('data').dataByTopic[1].dates.forEach(obj => { LY.push(obj.value) })
        this.model.get('data').dataByTopic[1].dates.forEach(obj => { LYNulls.push(null) })

        this.model.get('data').dataByTopic[0].dates.forEach(obj => { ts.push(obj.dateKey.substring(0, 10)) })


        var allDays = []
        this.model.get('data').dataByTopic[0].dates.forEach(obj => { allDays.push(obj.dateKey.substring(0, 10)) })
        var numDays = DateFns.differenceInDays(allDays[allDays.length - 1], allDays[0]);
        if (numDays > 0 && numDays <= 10) {
            var tsFiltered = allDays.filter(date => true)
        }
        else if (numDays > 10 && numDays <= 20) {

            var tsFiltered = allDays.filter((date, i) => i % 2 === 0)
        }
        else if (numDays > 20 && numDays <= 60) {

            var tsFiltered = allDays.filter((date, i) => {

                return DateFns.isSunday(date)
            })
        }
        else if (numDays > 60 && numDays <= 90) {

            var tsFiltered = allDays.filter((date, i) => {

                return DateFns.isFirstDayOfMonth(date) || DateFns.getDate(date) === 15;
            })
        }
        else {

            var tsFiltered = allDays.filter((date, i) => {

                return DateFns.isFirstDayOfMonth(date);
            })
        }
    }

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

module.exports = LineChartM;
