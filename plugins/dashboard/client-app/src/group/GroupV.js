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

    },

    ui: {
        'footer': '[data-region-id="footer"]',
        'devices': '[data-region-id="devices"]',
        'main-content': 'div.main-content',
        'checkbox-switch-status': '[data-id="checkbox-switch-status"]',
        'status-text': '[data-id="status-text"]',
        ///'add-controller': '[data-id="add-controller"]',
        'datepicker': 'input[data-id="flatpickr-datepicker"]',
        'datepicker-option': '[data-id="datepicker-select"] > a.dropdown-item',
        'chart-container': '[data-id="chart-container"]',
        'chart-container-battery': '[data-id="chart-container-battery"]',  // to be removed
        'controller-options': '[data-id="controllers-table"] tr a',
        'add-automatism': '[data-id="add-automatism"]',
    },

    events: {
        'change @ui.checkbox-switch-status': 'onChangeStatus',
        ///'click @ui.add-controller': 'onClickAddController',
        'click @ui.datepicker-option': 'setDatepickerSelection',
        'click @ui.add-automatism': 'onClickAddAutomatism',
    },

    regions: {
        'footer': '@ui.footer',
        'devices': '@ui.devices',
    },

    onAttach: function() {

        this.createDatepicker();
        let initialToDate = internals.initialToDate = DateFns.startOfToday();
        let initialFromDate = internals.initialFromDate = DateFns.subDays(initialToDate, 4);

        Radio.channel('dates').request('set', [initialFromDate, initialToDate]);

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

    createDatepicker: function() {

        // see: https://chmln.github.io/flatpickr/instance-methods-properties-elements/
        this.flatpickr = Flatpickr(this.getUI('datepicker').get(0), {

            mode: "range",
            //altInput: true,

            maxDate: DateFns.startOfToday(),
            minDate: DateFns.subMonths(DateFns.startOfToday(), 13),
            
            onChange: (newDates, dateStr, datepicker) => {

                if (newDates.length !== 2) {
                    return
                }

                let currentDates = Radio.channel('dates').request('get');
                if (DateFns.isSameDay(currentDates[0], newDates[0]) && DateFns.isSameDay(currentDates[1], newDates[1])) {
                    return;
                }

                const triggerChangeOnDatepicker = false;
                Radio.channel('dates').request('set', newDates, triggerChangeOnDatepicker);
             },
             
             plugins: [
                //new MonthSelectPlugin({ abc: 456 }),
                //new RangePlugin()

            ],

        });


        let view = this;
        Radio.channel('dates').reply('set', function (dates, triggerChangeOnDatepicker = true) {

            if (!Array.isArray(dates)) { return }

            this._dates = dates;
            view.fetchData();

            if (triggerChangeOnDatepicker) {
                view.flatpickr.setDate(dates, triggerChangeOnDatepicker);
            }
        });

        Radio.channel('dates').reply('get', function () {

            return this._dates;
        });
    },

    setDatepickerSelection: function (ev) {

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

        Radio.channel('dates').request('set', [fromDate, toDate]);

    },

    
    getReadings: function (deviceMac) {

        let currentDates = Radio.channel('dates').request('get');
        let period = DateFns.differenceInHours(internals.initialToDate, internals.initialFromDate)

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
                //period: period
                fromDate: DateFns.format(currentDates[0], 'YYYY-MM-DD'),
                toDate: DateFns.format(DateFns.addDays(currentDates[1], 1), 'YYYY-MM-DD'),
                //deviceMac: '12:34:56:ab:cd:ef' // -- special mac address to by pass the where 'device_mac = ...'
                deviceMac: deviceMac
            },
        }))

    },
    
    computeWPLinear: function (resistance){

        let wp = resistance / 146.87;

        return wp;
    },

    computeWPQuadratic: function (resistance, temp){

        if (resistance > 12000 || resistance < 0) {
            return null;
        }

        if (temp > 60 || resistance < -20) {
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
        Q.all(devices.map(obj => this.getReadings(obj.mac))).then(responses => { 

            // responses is an array of arrays (each inner array if relative to 1 device/mac)
            let allMacs = [];
            
            responses.forEach((responseMac, i) => {

                // handle the case of not having any reading for some device
                if (responseMac.length === 0) {
                    responses[i] = undefined;
                    return;
                }

                allMacs.push(responseMac[0].device_id);
            });
            
            responses = _.compact(responses);

            // main array of arrays for the chart
            let data = {};

            // main loop
            allMacs.forEach((mac, i) => {
//debugger
                // array of array relative to the data for this device/mac (will be copied to the main array declared above);
                // the inner array will have: ts; wp1, wp2, wp3, battery
                let dataMac = [[], [], [], [], []];
                let readingsMac = responses[i];

                let readingsTemp = readingsMac.filter(obj => obj.type === 't');
                // TODO: exclude outliers for temperature

                readingsTemp.forEach(objTemp => {
//debugger
                    // get the batch of wp reading relative to this temp. reading;
                    // normally we should 5 elements in a batch: 1 temp + 3 wp + 1 batt (here we filtering only for the 3 wp)
                    let readingsBatch = readingsMac.filter(obj => {

                        return Math.abs(DateFns.differenceInMilliseconds(objTemp.ts, obj.ts)) < 100 && (obj.type === 'h' || obj.type === 'b');
                    })

                    // store ts and battery
                    dataMac[0].push(objTemp.ts);

                    let l = readingsBatch.length;
                    for (let j = 0; j < l; j++) {
                        let obj = readingsBatch[j];

                        if (obj.type !== 'b') { continue }

                        dataMac[4].push(obj.val);
                    }


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
                })

                data[mac] = dataMac;
            })

            this.refreshPlotly(data);
            this.refreshPlotlyBattery(data);




            /*
            for (let key in data) {
                data[key] 
            }

            let ts = [];
            let data1 = [];
            let data2 = [];
            let data3 = [];
            let data4 = [];

            internals.response = responses[0];

            // loop for wp
            for (let i = 0; i < internals.response.length; i++) {

                let response = internals.response[i];
                response.val = Math.abs(response.val);

                if (response.val > 12000 || response.val < 0) { continue }

                if (response.sid !== 2) { continue }


                let arrayTemp = internals.response.filter(obj => {

                    return true && 
                        obj.device_id === response.device_id &&
                        obj.type === 't' && 
                        obj.val > -20 && 
                        obj.val < 50 &&
                        Math.abs(DateFns.differenceInMilliseconds(obj.ts, response.ts)) < 10;
                })

                if (response.device_id === 'f8:f0:05:f7:df:1f') {
                    ts.push(new Date(response.ts));

                    data1.push(this.computeWPLinear(response.val));

                    if (arrayTemp.length > 0) {
                        
                        data2.push(this.computeWPQuadratic(response.val, arrayTemp[0].val));
                    }
                    else {
                        data2.push(null);
                    }
                    
                    data3.push(null)
                    data4.push(null)
                }

                if (response.device_id === 'f8:f0:05:f5:e0:6e') {
                    ts.push(new Date(response.ts));
                    
                    data3.push(this.computeWPLinear(response.val));

                    if (arrayTemp.length > 0) {
                        
                        data4.push(this.computeWPQuadratic(response.val, arrayTemp[0].val));
                    }
                    else {
                        data4.push(null);
                    }

                    data1.push(null)
                    data2.push(null)
                }                    
            }

            ts.unshift('ts');

            data1.unshift('f8:f0:05:f7:df:1f-linear')
            data2.unshift('f8:f0:05:f7:df:1f-quadratic')
            data3.unshift('f8:f0:05:f5:e0:6e-linear')
            data4.unshift('f8:f0:05:f5:e0:6e-quadratic')
            
//debugger

            this.chart.load({
                columns: [
                    ts,
                    data1,
                    data2,
                    data3,
                    data4
                ]
            })




            // for battery

            let tsBattery = [];
            let data1Battery = [];
            let data2Battery = [];

            //internals.response = response;

            // loop for battery
            for (let i = internals.response.length - 1; i >= 0; i--) {

                let response = internals.response[i];

                if (response.type !== 'b') { continue }

                if (response.device_id === 'f8:f0:05:f7:df:1f') {
                    tsBattery.push(new Date(response.ts));
                    data1Battery.push(response.val);
                    data2Battery.push(null)
                }

                if (response.device_id === 'f8:f0:05:f5:e0:6e') {
                    tsBattery.push(new Date(response.ts));
                    data2Battery.push(response.val);
                    data1Battery.push(null)
                }                    
            }

            tsBattery.unshift('tsBattery');
            data1Battery.unshift('f8:f0:05:f7:df:1f-battery')
            data2Battery.unshift('f8:f0:05:f5:e0:6e-battery')
            
//debugger

            this.chartBattery.load({
                columns: [
                    tsBattery,
                    data1Battery,
                    data2Battery,
                ]
            })
            */

            
        })

        // setTimeout(() => {

        //     this.chart.load({
        //         columns: [
        //             ['Centro 1', 1, 2, 3, 4]
        //         ]
        //     })
        // }, 1000)

        /*

        this.chart = Billboard.bb.generate({
            bindto: this.getUI('chart-container').get(0),

            data: {
                x: "ts",
                columns: [
                    ts,
                    data1,
                    data2,
                    data3,
                    data4,
                    // centro3,
                    // poco1,
                    // poco2,
                    // poco3,
                ],
                types: {
                    'data1': 'line',
                    'data2': 'line',
                    'data3': 'line',
                    'data4': 'line',
                    // 'centro3': 'line',
                    // 'poco1': 'line',
                    // 'poco2': 'line',
                    // 'poco3': 'line',
                },
                
                // classes: {
                //     centro1: 'centro1',
                //     centro2: 'centro2',
                //     centro3: 'centro3',
                // }
                
                
            },
            zoom: {
                enabled: true,
            },
            // see: https://github.com/eventbrite/britecharts/blob/master/src/charts/helpers/colors.js
            
            color: {
                pattern: [
                    '#6aedc7', //green
                    '#39c2c9', //blue
                    '#ffce00', //yellow
                    '#ffa71a', //orange
                    '#f866b9', //pink
                    '#998ce3' //purple
                ]
            },
            

            transition: {
                duration: 200
            },

            point: {
                show: true,
                r: 2,
                focus: {
                    expand: {
                        enabled: true,
                        r: 4
                    }
                },
            },

            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        values: xTick.values,
                        format: xTick.format,
                        outer: false
                    }
                },
                y: {
                    
                    // label: {
                    //     text: 'Revenue',
                    //     position: 'outer-middle'
                    // },
                    

                    // TODO: adjust the padding taking into account the min valur: if the min is 'far' from 0, we should add some more
                    // padding
                    padding: {
                        top: 50,
                        bottom: 50 
                    },
                    tick: {
                        //TODOvalues: [0, 2000, 4000, 6000, 8000, 10000],
                        //format: yValue => Utils.getFormattedNumber(yValue, 'int', { precision: 1, html: false }),
                        format: yValue => yValue,
                        outer: false
                    }
                }
            },

            tooltip: {
                format: {
                    title: date => DateFns.format(date, 'dddd, D/MMM/YYYY HH:mm:ss'),
                    value: value => { if(value == null){ debugger} return value.toFixed(1) },
                }
            },
            grid: {

                x: {
                    show: false,
                    //lines: tsGrid.map(date => { return { value: date, class: 'chart-vertical-ticks' } })
                },
                y: {
                    show: true,
                },
            },

            size: {
                height: 300
            }
        });

        */



        /*

        var tsBattery = this.generateTs();
        tsBattery.unshift('tsBattery');

        var xTick = this.getXTick();

        let data1Battery = tsBattery.map(date => null)
        let data2Battery = tsBattery.map(date => null)

        data1Battery.unshift('f8:f0:05:f7:df:1f-battery')
        data2Battery.unshift('f8:f0:05:f5:e0:6e-battery')

        this.chartBattery = Billboard.bb.generate({
            bindto: this.getUI('chart-container-battery').get(0),

            data: {
                x: "tsBattery",
                columns: [
                    tsBattery,
                    data1Battery,
                    data2Battery,

                    // centro3,
                    // poco1,
                    // poco2,
                    // poco3,
                ],
                types: {
                    'data1Battery': 'line',
                    'data2Battery': 'line',

                    // 'centro3': 'line',
                    // 'poco1': 'line',
                    // 'poco2': 'line',
                    // 'poco3': 'line',
                },
                
                //classes: {
                //    centro1: 'centro1',
                //    centro2: 'centro2',
                //    centro3: 'centro3',
                //}
                
                
            },
            zoom: {
                enabled: true,
            },
            // see: https://github.com/eventbrite/britecharts/blob/master/src/charts/helpers/colors.js
            
            color: {
                pattern: [
                    '#6aedc7', //green
                    //'#39c2c9', //blue
                    //'#ffce00', //yellow
                    '#ffa71a', //orange
                    '#f866b9', //pink
                    '#998ce3' //purple
                ]
            },
            

            transition: {
                duration: 200
            },

            point: {
                show: true,
                r: 0,
                focus: {
                    expand: {
                        enabled: true,
                        r: 4
                    }
                },
            },

            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        values: xTick.values,
                        format: xTick.format,
                        outer: false
                    }
                },
                xxxy: {
                    

                    // TODO: adjust the padding taking into account the min valur: if the min is 'far' from 0, we should add some more
                    // padding
                    padding: {
                        top: 50,
                        bottom: 50 
                    },
                    tick: {
                        //TODOvalues: [0, 2000, 4000, 6000, 8000, 10000],
                        //format: yValue => Utils.getFormattedNumber(yValue, 'int', { precision: 1, html: false }),
                        format: yValue => yValue,
                        outer: false
                    }
                }
            },

            tooltip: {
                format: {
                    title: date => DateFns.format(date, 'dddd, D/MMM/YYYY HH:mm:ss'),
                    value: value => { if(value == null){ debugger} return value.toFixed(1) },
                }
            },
            grid: {

                x: {
                    show: false,
                    //lines: tsGrid.map(date => { return { value: date, class: 'chart-vertical-ticks' } })
                },
                y: {
                    show: true,
                },
            },

            size: {
                height: 300
            }
        });
        */
    },

    refreshPlotly: function(dataRaw) {

        // array of traces (plotly objects)
        let data = [];
        let devices = Radio.channel('public').request('devices');

        for (let key in dataRaw) {
            //debugger
            let device = devices.filter(obj => obj.mac === key)[0]

            for (let i = 1; i <= 3; i++) {
                let trace = $.extend(true, {}, UtilsPlotly.getTraceBase());
                trace.name = device.description + '_' + i;
                trace.x = dataRaw[key][0];
                trace.y = dataRaw[key][i];

                data.push(trace);
            }
        }

        let layoutOptions = {

            //title:'Adding Names to Line and Scatter Plot',
            dragmode: 'pan',
            yaxis: {
                title: 'water potential',
                //tickformat: 's', // "decimal notation with an SI prefix, rounded to significant digits."
                // more details here: https://github.com/d3/d3-format
                // see also: 'd3-format specifiers example': http://bl.ocks.org/zanarmstrong/05c1e95bf7aa16c4768e
                
                fixedrange: true, // disable zoom for y-axis
                hoverformat: '.3s'

            },
            xaxis: {
                type: 'date',
                //rangemode: 'tozero',
                tickformatstops:
                [
                /*
                    {
                        dtickrange: [null, 1000],
                        value: "%H:%M:%S.%L"
                    },
                    */
                    {
                        dtickrange: [null, 1000 * 60 * 60 * 24],
                        value: "%b %e %H:%M"
                    }
                ],

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


        let options = {
            scrollZoom: true,
            displaylogo: false,
            //showLink: false,
            modeBarButtons: [
                ['autoScale2d', 'zoomIn2d', 'zoomOut2d']
            ],
        }

        let gd = this.gd = this.getUI('chart-container').get(0);

        Plotly.newPlot(gd, data, layoutOptions, options);


        let currentPeriod = this.currentPeriod = Radio.channel('dates').request('get');

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

    refreshPlotlyBattery: function(dataRaw) {

        // array of traces (plotly objects)
        let data = [];
        let devices = Radio.channel('public').request('devices');

        for (let key in dataRaw) {
            //debugger
            let device = devices.filter(obj => obj.mac === key)[0]

            let trace = $.extend(true, {}, UtilsPlotly.getTraceBase());
            trace.marker.size = 2;
            trace.name = device.description;
            trace.x = dataRaw[key][0];
            trace.y = dataRaw[key][4];


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
                //rangemode: 'tozero',
                tickformatstops:
                [
                /*
                    {
                        dtickrange: [null, 1000],
                        value: "%H:%M:%S.%L"
                    },
                    */
                    {
                        dtickrange: [null, 1000 * 60 * 60 * 24],
                        value: "%b %e %H:%M"
                    }
                ],

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

        let options = {
            scrollZoom: true,
            displaylogo: false,
            //showLink: false,
            modeBarButtons: [
                ['autoScale2d', 'zoomIn2d', 'zoomOut2d']
            ],
        }

        let gd = this.gd = this.getUI('chart-container-battery').get(0);

        Plotly.newPlot(gd, data, layoutOptions, options);


        let currentPeriod = this.currentPeriod = Radio.channel('dates').request('get');

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



});

// TODO: create dinamically the number of regions? add a dynamic numer of cards (like a collection view, but not exaclty the same)
//console.log(View.prototype.regions)


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
