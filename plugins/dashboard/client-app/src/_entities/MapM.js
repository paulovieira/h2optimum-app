var Backbone = require('backbone');
var Radio = require('backbone.radio');
var DateFns = require('date-fns');
var _ = require('underscore');
var Q = require('q');
var Utils = require('../_common/utils');

var internals = {};

var MapM = Backbone.Model.extend({

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
            //throw new Error('dataCode attribute is not defined')
            // TODO: for this model we should be able to set more then 1 dataCode?
            this.set('dataCode', 'REVENUE_INTERVAL')
            this.set('dataGroupedBy1', 'COUNTRY')
        }

        //debugger
        Q.all([this._fetchCY(), this._fetchLY()])
        .then(response => {

            var data = this.processData(response);
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


        //dataRequest = [dataRequest];

        var data = {
            connectionName: Utils.getConfig('connectionName'),
            dataRequests: [dataRequest]
        }

        return Q($.ajax({
            url: '/api/v1/Statistics/GetGenericDataA',
            data: JSON.stringify(data),
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

    processData: function (response) {

        var geoJson = JSON.parse(JSON.stringify(require('../../web_modules//world.geo.json/countries2.geo.json')));

        // TODO: add the other periods for each country?
        this.processYear(geoJson, response[0], 'revenue', 'current');
        this.processYear(geoJson, response[1], 'revenue', 'currentLY');

        return geoJson;
    },

    processYear: function(geoJson, response, metric, period){

        var propName = metric + '_' + period;

        geoJson.features.forEach(obj => { obj.properties[propName] = undefined })

        if (response.success === false) {
            return;
        }

        response.data.forEach(obj => {

            var countryCode = obj.DataPointCode;
            var feature = geoJson.features.filter(obj2 => obj2.properties.alpha2 === countryCode)[0]

            if (feature === undefined) {
                console.log('country not found: ', countryCode)
                return;
            }
            
            feature.properties[propName] = obj.Value;
        });
    },



});

module.exports = MapM;
