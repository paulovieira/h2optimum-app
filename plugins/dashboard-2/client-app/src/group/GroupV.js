let $ = require('jquery');
let Q = require('q');
let _ = require('underscore');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
let Radio = require('backbone.radio');
let Flatpickr = require('flatpickr')
let DateFns = require('date-fns');
//let Billboard = require('billboard.js');
let Plotly = require('plotly.js/lib/index-cartesian')
let UtilsPlotly = require('_common/utils-plotly');

let Billboard = {}

let Utils = require('../_common/utils');
//let AddNewControllerV = require('./AddNewControllerV');
let DevicesListV = require('../devices/DevicesListV')
let AddNewAutomatismV = require('./AddNewAutomatismV');
///let PopoverConfig = require('../_config/popover');

let internals = {};
internals.measurementPeriodInMinutes = 20;

internals.ONE_HOUR     = 1000 * 60 * 60 * 1;
internals.TWO_HOURS    = 1000 * 60 * 60 * 2;
internals.THREE_HOURS  = 1000 * 60 * 60 * 3;
internals.SIX_HOURS    = 1000 * 60 * 60 * 6;
internals.TWELVE_HOURS = 1000 * 60 * 60 * 12;
internals.ONE_DAY      = 1000 * 60 * 60 * 24;
internals.TWO_DAYs     = 1000 * 60 * 60 * 24 * 2;



let View = Mn.View.extend({

    // important: the root element of the first child view inside the 'main-container' region must be a main.main-container
    // (in fact the element of the 'for-main-container' will be removed because we use the replaceElement optoin)

    tagName: 'main',
    className: 'main-container',

    initialize: function(){

        var groupId = Math.ceil(Math.random() * 3);
        this.model.set({ groupId: groupId})
        
        // this.listenTo(Radio.channel('popover'), 'popover:item:clicked', function(popoverId){
        //     debugger
        // })
        //Radio.channel('popover').listenTo('popover:item:clicked', popoverId);
        //Radio.channel('popover').on('popover:item:clicked', function(popoverId){
        //    debugger
        //});

        this.listenTo(Radio.channel('public'), 'refresh:devices', () => {

            this.fetchData();
        })

        this.datepickerM = Radio.channel('collections').request('datepickerM');
        this.listenTo(this.datepickerM, 'change:period', () => { this.fetchData() })

    },

    ui: {
        'footer': '[data-region-id="footer"]',
        'devices': '[data-region-id="devices"]',
        'main-content': 'div.main-content',
        'checkbox-switch-status': '[data-id="checkbox-switch-status"]',
        'status-text': '[data-id="status-text"]',
        ///'add-controller': '[data-id="add-controller"]',
        'chart-container': '[data-id="chart-container"]',
        'chart-container-battery': '[data-id="chart-container-battery"]',  // to be removed
        'controller-options': '[data-id="controllers-table"] tr a',
        'add-automatism': '[data-id="add-automatism"]',

        'download-xls': '[data-id="download-xls"]',
        'download-img': '[data-id="download-img"]',
        'edit-threshold': '[data-id="edit-threshold"]',
    },

    events: {
        'change @ui.checkbox-switch-status': 'onChangeStatus',
        'click @ui.add-automatism': 'onClickAddAutomatism',

        'click @ui.download-xls': 'downloadXls',
        'click @ui.download-img': 'downloadImg',
        'click @ui.edit-threshold': 'editThreshold'
    },

    regions: {
        'footer': '@ui.footer',
        'devices': '@ui.devices',
    },

    onAttach: function() {

        let devicesM = new Backbone.Model({
            slug: this.model.get('slug'),
            installationId: this.model.get('id'),
        });

        this.getRegion('devices').show(new DevicesListV({ 
            model: devicesM
        }))
    },

    onRender: function () {

        //var data = this.fetchData();
        ///this.getUI('controller-options').popover(PopoverConfig.controller);


    },

    // fetchData: function () {

    //     var data = Radio.channel('public').request('controllerGroups');
    //     return data;
    // },

    onChangeStatus: function (ev) {

        let systemIsOn = this.getUI('checkbox-switch-status').prop('checked');
        let color = systemIsOn ? '#46be8a': ''; 

        this.getUI('status-text').css('color', color)
    },

    /*
    onClickAddController: function (ev) {
debugger

        var addNewControllerV = new AddNewControllerV({
            onCloseModal: options => {
                
                // TODO: refresh table with controllers
            }
        });

        Utils.showAsModal(addNewControllerV, 'small');

    },
*/
    onClickAddAutomatism: function (ev) {

        var addNewAutomatismV = new AddNewAutomatismV({
            onCloseModal: options => {
                
                // TODO: refresh table with controllers
            }
        });

        Utils.showAsModal(addNewAutomatismV, 'large');
    },

    
    getReadings: function (deviceMac) {

        let currentDates = this.datepickerM.getPeriod();
        ///let period = DateFns.differenceInHours(internals.initialToDate, internals.initialFromDate)

        // the measurements are available only from the API domain (different than the one from this app)
        let protocol = window.location.href.split(':')[0];
        let domain = window.h2optimum.isProduction ? 'api.2adapt.pt' : 'localhost:8000';
        domain = protocol + '://' + domain;
        

        return Q($.ajax({
            type: 'GET',
            //url: '/v1/get-readings',
            url: domain + '/v1/get-measurements',
            //url: '/v1/get-measurements',
            data: {
                fromDate: Utils.dateFnsFormat(currentDates[0]),
                toDate: Utils.dateFnsFormat(DateFns.addDays(currentDates[1], 1)),
                deviceMac: deviceMac
            },
        }))

    },
    
    computeWPLinear: function (resistance){

        let wp = resistance / 146.87;

        return wp;
    },

    computeWPQuadratic: function (resistance, temp){

        if (resistance > 40000 || resistance < 0) {
            return null;
        }

        if (temp > 60 || temp < -20) {
            return null;
        }

        let wp = 0;
        resistance = resistance / 1000;

        if (resistance < 1) {
            wp = -20 * (resistance * (1 + 0.018 * (temp - 24)) - 0.55);
        }
        else if (resistance < 8) {
            wp = (-3.213 * resistance - 4.093) / (1 - 0.009733 * resistance - 0.01205 * temp);
        }
        else {
            wp = -2.246 - 5.239 * resistance * (1 + 0.018 * (temp - 24)) - 0.06756 * Math.pow(resistance, 2) * Math.pow(1 + 0.018 * (temp - 24), 2);
        }

        return Math.abs(wp);
    },

    fetchData: function() {

        let devices = Radio.channel('public').request('devices');

        if (devices === undefined) {
            return
        }
/*
        var ts = this.generateTs();
        ts.unshift('ts');

        var xTick = this.getXTick();

        let data1 = ts.map(date => null)
        let data2 = ts.map(date => null)
        let data3 = ts.map(date => null)
        let data4 = ts.map(date => null)

        data1.unshift('f8:f0:05:f7:df:1f-linear')
        data2.unshift('f8:f0:05:f7:df:1f-quadratic')
        data3.unshift('f8:f0:05:f5:e0:6e-linear')
        data4.unshift('f8:f0:05:f5:e0:6e-quadratic')
        */

        //let currentDates = Radio.channel('dates').request('get');
        //xxx

        /*
        var centro3 = this.generateMeasurements(ts, 3);
        var poco1 = this.generateMeasurements(ts, 0.2);
        var poco2 = this.generateMeasurements(ts, 0.5);
        var poco3 = this.generateMeasurements(ts, 1.5);



        centro3.unshift('Centro 3');
        poco1.unshift('Poço 1');
        poco2.unshift('Poço 2');
        poco3.unshift('Poço 3');
*/

    
        //devices.push({ mac: 'f8:f0:05:f5:e0:6c'});
        console.time('getReadings')
        Q.all(devices.map(obj => this.getReadings(obj.mac))).then(responses => { 

            console.timeEnd('getReadings')
            // responses is an array of arrays (each inner array if relative to 1 device/mac)
            let allMacs = [];
            
            console.time('missingData')
            responses.forEach((responseMac, i) => {

                // handle the case of not having any reading for some device
                if (responseMac.length === 0) {
                    responses[i] = undefined;
                    return;
                }

                allMacs.push(responseMac[0].device_id);
            });
            
            responses = _.compact(responses);
            console.timeEnd('missingData')

            // main array of arrays for the chart
            let data = {};

            // main loop
            allMacs.forEach((mac, i) => {

                let readingsMac = responses[i];


                for (let i = 0; i < readingsMac.length; i++) {
                    readingsMac[i].tsFormatted = Utils.dateFnsFormat(readingsMac[i].ts, 'YYYY-MM-DDTHH:mm:ss')
                }


                // array of array relative to the data for this device/mac (will be copied to the main array declared above);
                // the inner array will have: ts; wp1, wp2, wp3, battery
                let dataMac = [[], [], [], [], [], []];
               

                let readingsTemp = readingsMac.filter(obj => obj.type === 't');
                // TODO: exclude outliers for temperature

                console.time('processData')
                readingsTemp.forEach(objTemp => {

                    // get the batch of wp reading relative to this temp. reading;
                    // normally we should 5 elements in a batch: 1 temp + 3 wp + 1 batt (here we filtering only for the 3 wp)

                    let readingsBatch = readingsMac.filter(obj => {

                        return obj.tsFormatted === objTemp.tsFormatted && (obj.type === 'h' || obj.type === 'b' || obj.type === 't' );
                        //return Math.abs(DateFns.differenceInMilliseconds(objTemp.ts, obj.ts)) < 100 && (obj.type === 'h' || obj.type === 'b');
                    })


                    // store ts and battery
                    //dataMac[0].push(objTemp.ts);
                    dataMac[0].push(objTemp.tsFormatted);

                    let l = readingsBatch.length;

                    for (let j = 0; j < l; j++) {
                        let obj = readingsBatch[j];

                        if (obj.type !== 'h') { continue }

                        // wp reading shouls have sid 2, 3, or 4 (TODO: what if it doesn't have?)
                        if (obj.sid <= 1 || obj.sid >= 5) {
                            throw new Error('invalid sid: ' + obj.sid);
                        }

                        // ntoe that computeWPQuadratic will check the input value to exclude outliers
                        dataMac[obj.sid - 1].push(this.computeWPQuadratic(obj.val, objTemp.val));
                    }

                    for (let j = 0; j < l; j++) {
                        let obj = readingsBatch[j];

                        if (obj.type !== 't') { continue }

                        dataMac[4].push(obj.val);
                    }
                    
                    for (let j = 0; j < l; j++) {
                        let obj = readingsBatch[j];

                        if (obj.type !== 'b') { continue }

                        dataMac[5].push(obj.val);
                    }
                })

                data[mac] = dataMac;
            })
            console.timeEnd('processData')

            console.time('refreshPlotly')

            this.refreshPlotly(data);
            this.refreshPlotlyBattery(data);
            console.timeEnd('refreshPlotly')



            
        })

    },

    refreshPlotly: function(dataRaw) {


        internals.dataRaw = dataRaw;

        // array of traces (plotly objects)
        let data = [];
        let devices = Radio.channel('public').request('devices');

        for (let key in dataRaw) {
            //debugger
            let device = devices.filter(obj => obj.mac === key)[0]

            for (let i = 1; i <= 4; i++) {
                let trace = $.extend(true, {}, UtilsPlotly.getTraceBase());

                let description = '';

                if (devices.length === 1) {
                    description = 'sensor';
                }
                else {
                    description = device.description;
                }

                trace.name = description + ' ' + i;    
                

                if (i === 4) { 
                    //trace.name = device.description + '_temperature';
                    trace.name = 'temperature';
                    trace.visible = 'legendonly';
                }

                //trace.x = dataRaw[key][0];
                trace.x = dataRaw[key][0].map(dateStr => new Date(dateStr));
                trace.y = dataRaw[key][i];

                data.push(trace);
            }
        }

        
        let maxY = 50;
        if (data.length > 0) {
            maxY = _.max([_.max(data[0].y), _.max(data[1].y), _.max(data[2].y), _.max(data[3].y)]);
            maxY = Math.round(maxY) + 5;
        }
        
        let currentDates = this.datepickerM.getPeriod();
        let fromDate = currentDates[0];
        let toDate = Utils.dateFnsFormat(DateFns.addDays(currentDates[1], 1));
        //let toDate = currentDates[1];

        //let xZeroTime = new Date(YYYY, MM, DD).getTime();
        //let xZeroTime = DateFns.parse(fromDate + 'T00:00:00.000Z')
        let YYYY = parseInt(fromDate.split('-')[0]);
        let MM   = parseInt(fromDate.split('-')[1]) - 1;
        let DD   = parseInt(fromDate.split('-')[2]);
        //let xZeroTime = newDateFns.parse(fromDate + 'T00:00:00.000Z')
        let xZeroTime = new Date(YYYY, MM, DD)
        //debugger

        // YYYY = parseInt(toDate.split('-')[0]);
        // MM   = parseInt(toDate.split('-')[1]) - 1;
        // DD   = parseInt(toDate.split('-')[2]);
        // let xOneTime = new Date(YYYY, MM, DD).getTime();

        let xOneTime = _.last(data[0].x);
        //let xOneTime = DateFns.parse(toDate  + 'T00:00:00.000Z')

        //let maxY = 99;
        let layoutOptions = {

            //title:'Adding Names to Line and Scatter Plot',
            dragmode: 'pan',
            yaxis: {
                title: 'water potential (cbar)',
                //tickformat: 's', // "decimal notation with an SI prefix, rounded to significant digits."
                // more details here: https://github.com/d3/d3-format
                // see also: 'd3-format specifiers example': http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
                
                //fixedrange: true, // disable zoom for y-axis
                hoverformat: '.3s',
                rangemode: 'tozero'
                //range: [-5,  _.max([maxY, 60]) + 5]

            },
            xaxis: {
                type: 'date',
                //rangemode: 'tozero',
                tickangle: 0,
                //tickformat: '%H:%M',
                /*
                xtickformatstops:
                [
                
                    {
                        dtickrange: [null, 1000],
                        value: "%H:%M:%S.%L"
                    },
                    
                    {
                        dtickrange: [null, internals.ONE_HOUR],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f1'
                    },
                    {
                        dtickrange: [internals.ONE_HOUR, internals.TWO_HOURS],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f2'
                    },
                    {
                        dtickrange: [internals.TWO_HOURS, internals.THREE_HOURS],
                        value: "%b %e %H:%M f3"
                        //value: '%H:%M f3'
                    },
                    {
                        dtickrange: [internals.THREE_HOURS, internals.SIX_HOURS],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f4'
                    },
                    {
                        dtickrange: [internals.SIX_HOURS, internals.TWELVE_HOURS],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f5'
                    },
                    {
                        dtickrange: [internals.TWELVE_HOURS, internals.ONE_DAY],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f6'
                    },
                    {
                        dtickrange: [internals.ONE_DAY, internals.TWO_DAYs],
                        //value: "%b %e %H:%M"
                        value: '%H:%M f7'
                    },

                ],
                */

            },
            height: 400,  // probably should be computed dynamically, according to the width of the screen
            margin: {
                l: 50,
                r: 50,
                b: 75,
                t: 0,
                pad: 0
            },

            
            legend: {
                orientation: 'h',
            },
/*
            shapes: [
                {
                    type: 'line',
                    x0: xZeroTime,
                    y0: 10,

                    x1: xOneTime,
                    y1: 10,

                    line: {
                        color: 'blue',
                        width: 1,
                        dash: 'dashdot'
                    },

                },

                {
                    type: 'line',
                    x0: xZeroTime,
                    y0: 30,

                    x1: xOneTime,
                    y1: 30,

                    line: {
                        color: 'gray',
                        width: 0.5,
                        //dash: 'dashdot'
                    },

                },

            ]
            */

            // shapes wih rectangles
            /*
            shapes: [
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 0,
                    y1: 10,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 102, 204, 0.4)'
                    fillcolor: 'blue',
                    opacity: 0.2

                },
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 10,
                    y1: 30,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 128, 0, 0.2)'
                    fillcolor: 'green',
                    opacity: 0.2
                },

                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 30,
                    y1: 100,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 128, 0, 0.2)'
                    fillcolor: 'orange',
                    opacity: 0.2
                },
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 100,
                    y1: maxY,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(153, 0, 0, 0.2)'
                    fillcolor: 'red',
                    opacity: 0.2
                },

            ]
            */

            shapes: [
            /*
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 0,
                    y1: 10,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 102, 204, 0.4)'
                    fillcolor: 'blue',
                    opacity: 0.2

                },
                */

                /*
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 10,
                    y1: 30,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 128, 0, 0.2)'
                    fillcolor: 'gray',
                    opacity: 0.2
                },
                */
/*
                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 30,
                    y1: 100,
                    line: {
                        width: 0
                    },
                    //fillcolor: 'rgba(0, 128, 0, 0.2)'
                    fillcolor: 'orange',
                    opacity: 0.2
                },
                */

                {
                    type: 'line',
                    x0: xZeroTime,
                    x1: xOneTime,
                    y0: 10,
                    y1: 10,
                    line: {
                      color: 'rgba(128, 128, 128, 0.99)',
                      width: 0.5,
                      dash: '10px 10px'
                    },
                },

                {
                    type: 'line',
                    x0: xZeroTime,
                    x1: xOneTime,
                    y0: 60,
                    y1: 60,
                    line: {
                      color: 'rgba(128, 128, 128, 0.99)',
                      width: 0.5,
                      dash: '10px 10px'
                    },
                },

                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 10,
                    y1: 60,
                    line: {
                        width: 0
                    },
                    fillcolor: 'rgba(128, 128, 128, 0.2)',
                },


            ]
            
        };


        if (maxY > 100) {

            layoutOptions.shapes.push(

                {
                    type: 'line',
                    x0: xZeroTime,
                    x1: xOneTime,
                    y0: 100,
                    y1: 100,
                    line: {
                      color: 'rgba(128, 128, 128, 0.99)',
                      width: 0.5,
                      dash: '10px 10px'
                    },
                },

                {
                    type: 'rect',
                    x0: xZeroTime,
                    x1: xOneTime,

                    y0: 100,
                    y1: maxY,
                    line: {
                        width: 0
                    },
                    fillcolor: 'rgba(128, 128, 128, 0.2)',
                }
            )
        }

        if (data.length === 0) {
            layoutOptions.xaxis.range = [fromDate, toDate];
        }


        let options = {
            scrollZoom: true,
            displaylogo: false,
            //showLink: false,
            modeBarButtons: [
                ['autoScale2d', 'zoomIn2d', 'zoomOut2d']
            ],
        }

        let gd = this.getUI('chart-container').get(0);
        internals.gdSensors = gd;

        Plotly.newPlot(gd, data, layoutOptions, options);
        // setTimeout(() => {

        //     Plotly.relayout(gd, layoutOptions);
        // }, 1000)

        $(window).on('resize', () => { Plotly.Plots.resize(gd) })



        //let currentPeriod = this.currentPeriod = Radio.channel('dates').request('get');

        // based on this example: https://codepen.io/etpinard/pen/vXrRLR
        // internals.isUnderRelayout = false;
        // internals.previousRange = {
        //     'xaxis.range[0]': currentPeriod[0],
        //     'xaxis.range[1]': currentPeriod[1]
        // };

        /*
        this.isUnderRelayout = false;
        this.previousRange = {
            'xaxis.range[0]': currentPeriod[0],
            'xaxis.range[1]': currentPeriod[1]
        };

        gd.on('plotly_relayout', UtilsPlotly.updateRangeOnZoomOut.bind(this))
        */

        gd.on('xplotly_relayout', (ev) => {

            let max;
            if (_.isNumber(ev['yaxis.range[1]'])) {
                max = Math.round(ev['yaxis.range[1]']) + 1;
            }

            if (max === undefined) { return }

            let layoutOptions = {
                shapes: [
                
                    {
                        type: 'rect',
                        x0: xZeroTime,
                        x1: xOneTime,

                        y0: 0,
                        y1: 10,
                        line: {
                            width: 0
                        },
                        fillcolor: 'rgba(0, 102, 204, 0.99)'
                    },
                    
                    {
                        type: 'rect',
                        x0: xZeroTime,
                        x1: xOneTime,

                        y0: 10,
                        y1: 30,
                        line: {
                            width: 0
                        },
                        fillcolor: 'rgba(0, 128, 0, 0.99)'
                    },
                    
                    {
                        type: 'rect',
                        x0: xZeroTime,
                        x1: xOneTime,

                        y0: 30,
                        y1: 100,
                        line: {
                            width: 0
                        },
                        fillcolor: 'rgba(153, 0, 0, 0.99)'
                    },

                    {
                        type: 'rect',
                        x0: xZeroTime,
                        x1: xOneTime,

                        y0: 100,
                        y1: max,
                        line: {
                            width: 0
                        },
                        fillcolor: 'rgba(153, 0, 0, 0.99)'
                    },

                ]
            }
            console.log('current max: ', max)
            Plotly.relayout(gd, layoutOptions);
        });


    },

    refreshPlotlyBattery: function (dataRaw) {

        // array of traces (plotly objects)
        let data = [];
        let devices = Radio.channel('public').request('devices');

        for (let key in dataRaw) {
            //debugger
            let device = devices.filter(obj => obj.mac === key)[0]

            let trace = $.extend(true, {}, UtilsPlotly.getTraceBase());
            trace.marker.size = 2;
            trace.name = device.description;
            trace.x = dataRaw[key][0].map(dateStr => new Date(dateStr));
            trace.y = dataRaw[key][5];


            data.push(trace);
        }
        
        let layoutOptions = {

            //title:'Adding Names to Line and Scatter Plot',
            dragmode: 'pan',
            yaxis: {
                title: 'battery',
                //tickformat: 's', // "decimal notation with an SI prefix, rounded to significant digits."
                // more details here: https://github.com/d3/d3-format
                // see also: 'd3-format specifiers example': http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
                
                fixedrange: true, // disable zoom for y-axis
                hoverformat: '.3s'

            },
            xaxis: {
                type: 'date',
                tickangle: 0,
                //rangemode: 'tozero',
                // tickformatstops:
                // [
                // /*
                //     {
                //         dtickrange: [null, 1000],
                //         value: "%H:%M:%S.%L"
                //     },
                //     */

                //     {
                //         dtickrange: [null, 1000 * 60 * 60 * 24],
                //         value: "%b %e %H:%M"
                //     },
                //     {
                //         dtickrange: [1000 * 60 * 60 * 24, null],
                //         value: "%A"
                //     }
                // ],

            },
            height: 350,  // probably should be computed dynamically, according to the width of the screen
            margin: {
                l: 70,
                r: 50,
                b: 35,
                t: 0,
                pad: 18
            },

            /*
            legend: {
                orientation: 'h'
            }
            */
        };


        let currentDates = this.datepickerM.getPeriod();
        let fromDate = currentDates[0];
        let toDate = currentDates[1];

        if (data.length === 0) {
            layoutOptions.xaxis.range = [fromDate, toDate];
        }

        let options = {
            scrollZoom: true,
            displaylogo: false,
            //showLink: false,
            modeBarButtons: [
                ['autoScale2d', 'zoomIn2d', 'zoomOut2d']
            ],
        }

        let gd = this.getUI('chart-container-battery').get(0);
        internals.gdBattery = gd;

        Plotly.newPlot(gd, data, layoutOptions, options);

        $(window).on('resize', () => { Plotly.Plots.resize(gd) })


        //let currentPeriod = this.currentPeriod = Radio.channel('dates').request('get');

        // based on this example: https://codepen.io/etpinard/pen/vXrRLR
        // internals.isUnderRelayout = false;
        // internals.previousRange = {
        //     'xaxis.range[0]': currentPeriod[0],
        //     'xaxis.range[1]': currentPeriod[1]
        // };

        /*
        this.isUnderRelayout = false;
        this.previousRange = {
            'xaxis.range[0]': currentPeriod[0],
            'xaxis.range[1]': currentPeriod[1]
        };

        gd.on('plotly_relayout', UtilsPlotly.updateRangeOnZoomOut.bind(this))
        */


    },

    downloadXls: function (ev) {

        debugger;
        // 1) get data for the period
        // 2) tranform into the correcft structure for the xls
        // 3) export with the library

        // dynamically loading the scripts for zipcelx: https://github.com/egeriis/zipcelx

        // we do it this way
        // instead of using the dynamic imports from webpack to keep it simpler
        // (and also because zipcelx only works from the window object anyway...)

        if (internals.dataRaw === undefined) {
            throw new Error('dataRaw is undefined')
        };

        Q($.ajax({
            url: 'https://cdn.jsdelivr.net/npm/zipcelx@1.4.0/lib/standalone.min.js',
            dataType: 'script'
        }))
        .then(() => {

            // the jsPdf table plugin is not installed (somewhere inside window.jsPDF)
            this._generateXlsx();
        })
        .catch(err => {
            
            alert('ERROR: could not load the zipcelx scripts');
        });
    },


    _generateXlsx: function () {

        let devices = Radio.channel('public').request('devices');
        let sheetData = []; // array of arrays
        

        let headerRow = [];
        let hasDateColumn = false;
        for (let deviceKey in internals.dataRaw) {

            let descriptionSensor = '';
            let descriptionTemperature = '';
            let descriptionBattery = '';

            if (devices.length === 1) {
                descriptionSensor = 'sensor';
                descriptionTemperature = 'temperature';
                descriptionBattery = 'battery';
            }
            else {

                let device = devices.filter(obj => obj.mac === deviceKey)[0]

                descriptionSensor = device.description;
                descriptionTemperature = device.description + '_t';
                descriptionBattery = device.description + '_b';
            }

            
            if (hasDateColumn === false) {
                headerRow.push({ value: 'Date',                    type: 'string' })    
                hasDateColumn = true;
            }
            
            headerRow.push({ value: descriptionSensor + '_1 ', type: 'string' })
            headerRow.push({ value: descriptionSensor + '_2 ', type: 'string' })
            headerRow.push({ value: descriptionSensor + '_3 ', type: 'string' })
            headerRow.push({ value: descriptionTemperature,    type: 'string' })
            headerRow.push({ value: descriptionBattery,       type: 'string' })
        }

        
        sheetData.push(headerRow);

        for (let device in internals.dataRaw) {

            let dataForDevice = internals.dataRaw[device];
            
            for (let i = 0; i < dataForDevice[0].length; i++) {
                let dataRow = []
                dataRow.push({ value: DateFns.format(dataForDevice[0][i], 'YYYY-MM-DD HH:mm:ss') })
                dataRow.push({ value: dataForDevice[1][i] })
                dataRow.push({ value: dataForDevice[2][i] })
                dataRow.push({ value: dataForDevice[3][i] })
                dataRow.push({ value: dataForDevice[4][i] })
                dataRow.push({ value: dataForDevice[5][i] })

                sheetData.push(dataRow);
            }
        }

        let currentDates = this.datepickerM.getPeriod();
        let fromDate = Utils.dateFnsFormat(currentDates[0]);
        let toDate = Utils.dateFnsFormat(currentDates[1]);

        let config = {
            filename: 'readings_' + fromDate + '_' + toDate,
            sheet: {
                data: sheetData
            }
        }


        global.zipcelx(config);

    },

    downloadImg: function (ev) {

        let currentDates = this.datepickerM.getPeriod();
        let fromDate = Utils.dateFnsFormat(currentDates[0]);
        let toDate = Utils.dateFnsFormat(currentDates[1]);

        let downloadOptions = {
            filename: 'readings_' + fromDate + '_' + toDate,
            scale: '5',
            format: 'png'
        }

        this._downloadImg(downloadOptions);
    },

    _downloadImg: function (downloadOptions) {

        Plotly.downloadImage(internals.gdSensors, downloadOptions)
          .then(filename => {})
          .catch(err => {})
    },

    editThreshold: function (ev){

        var EditThresholdsV = require('./EditThresholdsV');

        var editThresholdsV = new EditThresholdsV({
            onCloseModal: options => {
                
                // TODO: refresh table with controllers
            }
        });

        Utils.showAsModal(editThresholdsV, 'small');

    }

/*
    generateTs: function () {

        let currentDates = Radio.channel('dates').request('get');
        let ts = [];

        DateFns.eachDay(currentDates[0], currentDates[1]).forEach(date => {

            let n = 24 * (60 / internals.measurementPeriodInMinutes);
            for (let i = 0; i < n; i++) {
                ts.push(DateFns.addMinutes(date, i * internals.measurementPeriodInMinutes));
            }
        });

        return ts;
    },
    */
    /*
    generateMeasurements: function (ts, index) {

        // let n = 24 * (60 / internals.measurementPeriodInMinutes)
        // let array = ts.map((date, i) => {

        //     //return Math.random() * 10;
        //     let hours = DateFns.getHours(date)
        //     if ((hours >= 22 || hours <= 5) && Math.random() >= 0.6) {
        //         return null;
        //     }

        //     return Math.cos((2 * Math.PI / n) * (i % n)) + Math.random() * 1 + index + 10;
        // });

        // return array;
        //return [null, null, null, null, null, ]
        return [2, 2, 2, 2, 2, ]
    },


    getXTick: function () {

        let currentDates = Radio.channel('dates').request('get');
        let diff = DateFns.differenceInDays(currentDates[1], currentDates[0]);

        let values = [];
        let format = x => x
        if (diff <= 3) {

            // show a tick every 6 hours
            let periodInHours = 6;
            let n = 24 / periodInHours;
            DateFns.eachDay(currentDates[0], currentDates[1]).forEach(date => {

                for (let i = 0; i < n; i++) {
                    values.push(DateFns.addHours(date, i * periodInHours));
                }
            });

            format = x => DateFns.getHours(x) === 0 ? DateFns.format(x, 'D - MMM') : DateFns.format(x, 'H:mm')
        }
        else if (diff > 3 && diff <= 7) {

            // show a tick every 12 hours
            let periodInHours = 12;
            let n = 24 / periodInHours;
            DateFns.eachDay(currentDates[0], currentDates[1]).forEach(date => {

                for (let i = 0; i < n; i++) {
                    values.push(DateFns.addHours(date, i * periodInHours));
                }
            });

            format = x => DateFns.getHours(x) === 0 ? DateFns.format(x, 'D - MMM') : DateFns.format(x, 'H:mm')
        }
        else if (diff > 7 && diff <= 20) {

            // show a tick every day
            DateFns.eachDay(currentDates[0], currentDates[1]).forEach(date => {

                values.push(date);
            });

            //format = x => DateFns.getHours(x) === 0 ? DateFns.format(x, 'D - MMM') : DateFns.format(x, 'H:mm')
            format = x => DateFns.format(x, 'D-MMM')
        }
        else if (diff > 20 && diff <= 40) {

            // show a tick every 2 days
            DateFns.eachDay(currentDates[0], currentDates[1]).forEach((date, i) => {

                if (i % 2 === 0) {
                    values.push(date);
                }
            });

            //format = x => DateFns.getHours(x) === 0 ? DateFns.format(x, 'D - MMM') : DateFns.format(x, 'H:mm')
            format = x => DateFns.format(x, 'D-MMM')
        }

        return { values: values, format: format };
    },
    */



});

// TODO: create dinamically the number of regions? add a dynamic numer of cards (like a collection view, but not exaclty the same)
//console.log(View.prototype.regions)


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
