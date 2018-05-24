

require('../_common/flatpickr-plugins/month-select.css');

var $ = require('jquery');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Flatpickr = require('flatpickr')
var Q = require('q');
//var WeekSelectPlugin = require('flatpickr/dist/plugins/weekSelect/weekSelect');
var RangePlugin = require('flatpickr/dist/plugins/rangePlugin');
var MonthSelectPlugin = require('../_common/flatpickr-plugins/month-select');
var Leaflet = require('leaflet')
var DateFns = require('date-fns');
var Bloodhound = require('typeahead.js/dist/bloodhound.js')
//var Typeahead = require('typeahead.js/dist/typeahead.jquery.js')
var Utils = require('../_common/utils');
var internals = {};


var View = Mn.View.extend({

    initialize: function(){

        this.summaryDataM = Radio.channel('data').request('summaryDataM');
    },
   
    ui: {
        'main-container': 'div[data-region-id="main-container"]',
        'datepicker': 'input[data-id="flatpickr-datepicker"]',
        'datepicker-option': '[data-id="datepicker-select"] > a.dropdown-item',
        'main-search': 'div[data-id="main-search"]',
        'account-menu-item': '[data-id="account-menu-item"]'
    },

    events: {
        'click @ui.datepicker-option': 'setDatepickerSelection',
        'click @ui.account-menu-item': 'onClickAccountMenuItem'
    },

    regions: {
        'main': {
            el: '@ui.main-container',
            replaceElement: true
        }
    },

    onAttach: function(){

        this.createDatepicker();
        this.createSearchEngine();

        // todo: call stopReply?

        Radio.channel('dates').reply('set', (newDates) => {
            // console.info("newDates", newDates);

            // TODO: newDates should always be an array with 2 dates?
            // or should we be able to change just one of the dates?
            if (!Array.isArray(newDates)) {
                newDates = [newDates];
            }

            this.flatpickr.setDate(newDates, true);
        });

        $('.sidebar-navigation').perfectScrollbar();
    },

    setDatepickerSelection: function(e){

        var $el = $(e.currentTarget);
        var fromDate = $el.data('from-date'), toDate = $el.data('to-date');

/*
        if (fromDate === 'mtd') {
            toDate = DateFns.startOfToday();
            fromDate = DateFns.startOfMonth(toDate);
        }
        else if (fromDate === 'ytd') {
            toDate = DateFns.startOfToday();
            fromDate = DateFns.startOfYear(toDate);
        }
*/

        // temporary code for the screen recording
        var hotelDate = '2017-10-29';

        if (fromDate === 'mtd') {
            toDate = DateFns.startOfDay(hotelDate);
            fromDate = DateFns.startOfMonth(toDate);
        }
        else if (fromDate === 'ytd') {
            toDate = DateFns.startOfDay(hotelDate);
            fromDate = DateFns.startOfYear(toDate);
        }

        Radio.channel('dates').request('set', [fromDate, toDate]);

    },

    createDatepicker: function() {

        // see: https://chmln.github.io/flatpickr/instance-methods-properties-elements/
        this.flatpickr = Flatpickr(this.getUI('datepicker').get(0), {

            mode: "range",
            //altInput: true,
            onChange: (selectedDates, dateStr, datepicker) => {

                if(selectedDates.length !== 2) {
                    return
                }

                // TODO: create an instance of this model only when the dashboard is created?
                this.summaryDataM.set('current', selectedDates);

                // important: set the 'current' property always after fromDate and toDate, to make sure
                // the other periods (MTD, etc) are well defined when the data is fetched from the server
                // which happen only after current is changed

                var previousFromDate = Radio.channel('dates').request('currentFromDate');
                Radio.channel('dates').reply('previousFromDate', previousFromDate);
                Radio.channel('dates').reply('currentFromDate', selectedDates[0]);

                var previousToDate = Radio.channel('dates').request('currentToDate');
                Radio.channel('dates').reply('previousToDate', previousToDate);
                Radio.channel('dates').reply('currentToDate', selectedDates[1]);

                Radio.channel('dates').trigger('change', selectedDates[0], selectedDates[1], previousFromDate, previousToDate);
             },
             plugins: [
                //new MonthSelectPlugin({ abc: 456 }),
                //new RangePlugin()

            ],

        });
    },

    createSearchEngine: function(){

        // typeahead + bloodhound (suggestion engine)

        var searchEngine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('searchTokens'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            //identify: obj => obj.url,  // not necessary for our simple case
        });

        searchEngine.add([
            {
              "url": "#adr",
              "title": "ADR",
              "description": "ADR details",
              "searchTokens": "adr average daily rate"
            },
            {
              "url": "#revenue",
              "title": "Revenue",
              "description": "Revenue details",
              "searchTokens": "revenue receita"
            },
            {
              "url": "#revpar",
              "title": "RevPAR",
              "description": "RevPAR details",
              "searchTokens": "revpar revenue per available room"
            },
        ])


        // https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
        this.getUI('main-search').find('input').typeahead(null, {
            //name: '...',
            source: searchEngine,
            display: 'title',
            templates: {
                suggestion: function(data) {

                    var html = `
                        <a href="#"><h6 class="mb-1">${ data.title }</h6><small>${ data.description }</small></a>
                    `
                    return html;
                }
            }
        });

        this.getUI('main-search').find('input').on('typeahead:select', function(e, data) {
            //debugger
            // console.log('typeahead:select', data)
            // console.log('hello world')
            //window.location.href = location.origin +'/'+ data.url;
        });

        this.getUI('main-search').find('input').on('typeahead:open', () => {

            this.getUI('main-search').find('.lookup-placeholder span').css('opacity', 0);
        });

        this.getUI('main-search').find('input').on('typeahead:close', () => {

            var $input = this.getUI('main-search').find('input.tt-input')
            if ($input.val() !== $input.val().trim()) {
                $input.val('')
            }

            if ($input.val() !== '') { return }

            this.getUI('main-search').find('.lookup-placeholder span').css('opacity', 1);
        });
    },

    onClickAccountMenuItem: function(ev) {

        let itemId = $(ev.currentTarget).attr('data-item-id');

        if (itemId === 'logout') {
            global.location.assign(Host.rootPath + '/Account/LogOff');
            return;
        }

    }

});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
