
var $ = require('jquery');
var Mn = require('backbone.marionette');
var Radio = require('backbone.radio');
var Q = require('q');
var Leaflet = require('leaflet')
var Bloodhound = require('typeahead.js/dist/bloodhound.js')
var Typeahead = require('typeahead.js/dist/typeahead.jquery.js')
var Utils = require('../_common/utils');
var internals = {};


var View = Mn.View.extend({

    initialize: function(){
    },
   
    ui: {
        'for-main-container': 'div[data-region-id="for-main-container"]',
        'main-search': 'div[data-id="main-search"]',
        'account-menu-item': '[data-id="account-menu-item"]'
    },

    events: {
        'click @ui.account-menu-item': 'onClickAccountMenuItem'
    },

    regions: {
        'for-main-container': {
            el: '@ui.for-main-container',
            replaceElement: true
        }
    },

    onAttach: function(){

        //this.createSearchEngine();

        // todo: call stopReply?

        $('.sidebar-navigation').perfectScrollbar();

        // this is the "app" object defined in 'window' by the 'theadmin' template
        app.isReady();
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
