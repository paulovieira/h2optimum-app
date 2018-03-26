let $ = require('jquery');
let Q = require('q');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Flatpickr = require('flatpickr')
var DateFns = require('date-fns');
var Billboard = require('billboard.js');

var Utils = require('../_common/utils');
var AddNewControllerV = require('./AddNewControllerV');
var AddNewAutomatismV = require('./AddNewAutomatismV');
var PopoverConfig = require('../_config/popover');

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
        
        this.listenTo(Radio.channel('popover'), 'popover:item:clicked', function(popoverId){
            debugger
        })
        //Radio.channel('popover').listenTo('popover:item:clicked', popoverId);
        //Radio.channel('popover').on('popover:item:clicked', function(popoverId){
        //    debugger
        //});
    },

    ui: {
        'footer': '[data-region-id="footer"]',
        'main-content': 'div.main-content',
        'checkbox-switch-status': '[data-id="checkbox-switch-status"]',
        'status-text': '[data-id="status-text"]',
        'add-controller': '[data-id="add-controller"]',
        'datepicker': 'input[data-id="flatpickr-datepicker"]',
        'datepicker-option': '[data-id="datepicker-select"] > a.dropdown-item',
        'chart-container': '[data-id="chart-container"]',
        'controller-options': '[data-id="controllers-table"] tr a',
        'add-automatism': '[data-id="add-automatism"]',
    },

    events: {
        'change @ui.checkbox-switch-status': 'onChangeStatus',
        'click @ui.add-controller': 'onClickAddController',
        'click @ui.datepicker-option': 'setDatepickerSelection',
        'click @ui.add-automatism': 'onClickAddAutomatism',
    },

    regions: {
        'footer': '@ui.footer',
    },

    onAttach: function() {

        this.createDatepicker();
        let initialToDate = internals.initialToDate = DateFns.startOfToday();
        let initialFromDate = internals.initialFromDate = DateFns.subDays(initialToDate, 4);

        Radio.channel('dates').request('set', [initialFromDate, initialToDate]);
    },

    onRender: function () {

        var data = this.fetchData();
        this.getUI('controller-options').popover(PopoverConfig.controller);


    },

    fetchData: function () {

        var data = Radio.channel('public').request('controllerGroups');

        return data;
    },

    onChangeStatus: function (ev) {

        let systemIsOn = this.getUI('checkbox-switch-status').prop('checked');
        let color = systemIsOn ? '#46be8a': ''; 

        this.getUI('status-text').css('color', color)
    },

    onClickAddController: function (ev) {

        var addNewControllerV = new AddNewControllerV({
            onCloseModal: options => {
                
                // TODO: refresh table with controllers
            }
        });

        Utils.showAsModal(addNewControllerV, 'small');
    },

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
            view.refreshBillboardChart();

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

    
    getReadings: function () {

        let currentDates = Radio.channel('dates').request('get');
        let period = DateFns.differenceInHours(internals.initialToDate, internals.initialFromDate)
        let domain = window.h2optimum.isProduction ? 'http://api.2adapt.pt' : 'http://localhost:8000';

        return Q($.ajax({
            type: 'GET',
            //url: '/v1/get-readings',
            url: domain + '/v1/get-readings',
            data: {
                period: period
            },
        }))

    },
    

    refreshBillboardChart: function() {

        var ts = this.generateTs();
        ts.unshift('ts');

        var xTick = this.getXTick();

        let data1 = ts.map(date => null)
        let data2 = ts.map(date => null)

        data1.unshift('f8:f0:05:f7:df:1f')
        data2.unshift('f8:f0:05:f5:e0:6e')
        

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
        // hardcoded
        Q(this.getReadings()).then(response =>{ 
//debugger
            let ts = [];
            let data1 = [];
            let data2 = [];

            internals.response = response;
            for (let i = 0; i < internals.response.length; i++) {
                ts.push(new Date(internals.response[i].ts));

                if (window.h2optimum.isProduction ) {
                    debugger
                    if (internals.response[i].sid === 1 && internals.response[i].device_id === 'f8:f0:05:f7:df:1f') {
                        data1.push(internals.response[i].val);
                    }

                    if (internals.response[i].sid === 1 && internals.response[i].device_id === 'f8:f0:05:f5:e0:6e') {
                        data2.push(internals.response[i].val);
                    }                    
                }
                else {
                    data1.push(internals.response[i].val);
                }

            }

            ts.unshift('ts');
            data1.unshift('f8:f0:05:f7:df:1f')
            data2.unshift('f8:f0:05:f5:e0:6e')
//debugger
            this.chart.load({
                columns: [
                    ts,
                    data1,
                    data2
                ]
            })
            
        })

        // setTimeout(() => {

        //     this.chart.load({
        //         columns: [
        //             ['Centro 1', 1, 2, 3, 4]
        //         ]
        //     })
        // }, 1000)


/*
        var tsGrid = ts.map((dateStr, i) => { 

            if (i === 0) { return 'tsGrid' }

            return DateFns.
        } )

        ['tsGrid'], '2018-02-01', '2018-02-02', '2018-02-03', '2018-02-04']
*/
        this.chart = Billboard.bb.generate({
            bindto: this.getUI('chart-container').get(0),

            data: {
                x: "ts",
                columns: [
                    ts,
                    data1,
                    data2,
                    // centro3,
                    // poco1,
                    // poco2,
                    // poco3,
                ],
                types: {
                    'data1': 'line',
                    'data2': 'line',
                    // 'centro3': 'line',
                    // 'poco1': 'line',
                    // 'poco2': 'line',
                    // 'poco3': 'line',
                },
                /*
                classes: {
                    centro1: 'centro1',
                    centro2: 'centro2',
                    centro3: 'centro3',
                }
                */
                
            },
            zoom: {
                enabled: true,
/*
                rescale: true,
                onzoom: function(domain, x, y, z) { 
                    debugger
                },
                onzoomstart: function(domain, x, y, z) { 
                    debugger
                },
                */
                onzoomend: function(domain, x, y, z) { 

                    var extent = chart.zoom();
                    // TODO: update the ticks manualy according to the new zoom
                }
                

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
                y: {
                    /*
                    label: {
                        text: 'Revenue',
                        position: 'outer-middle'
                    },
                    */

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
