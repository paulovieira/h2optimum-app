
var Backbone = require('backbone');
var Radio = require('backbone.radio');
var Utils = require('../_common/utils');
var internals = {};

exports.dashboardOneParam = {

    path: '/dashboard/:p1',
    validate: function (request) {
        debugger
        return false;
    },
};

exports.dashboardTwoParams = {

    path: '/dashboard/:p1/:p2',
    validate: function (request) {
        debugger
        return false;
    },
};

exports.dashboard = {

    path: '/dashboard',
    validate: function (request) {
    },

    children: [
    {
        view: require('../root/RootV'),
        region: 'rootR',

        children: [
        {
            view: require('../dashboard/DashboardV'),
            region: 'for-main-container',
            children: [
            {
                region: 'footer',
                view: require('../footer/FooterV')
            }
            ]
        }
        ]
    }
    ]
};

exports.group = {

    path: '/groups/:groupSlug',
    validate: function (request) {
    },

    children: [
    {
        view: require('../root/RootV'),
        region: 'rootR',

        children: [
        {
            view: require('../group/GroupV'),
            region: 'for-main-container',
            handler: function(viewClass, viewOptions){

                var requestData = viewOptions.request;
                viewOptions.request._ts = Date.now();
                var data = Radio.channel('public').request('controllerGroups');
                var dataFiltered = data.filter(obj => obj.groupSlug === requestData.params.groupSlug)

                if (dataFiltered.length === 0) {
                    alert('the group does not exist');
                    return false;
                }

                var model = new Backbone.Model(dataFiltered[0])
                viewOptions.model = model;

                var viewInstance = new viewClass(viewOptions);
                viewInstance.render();

                return viewInstance;
            },
            children: [
            {
                region: 'footer',
                view: require('../footer/FooterV')
            }
            ]
        }
        ]
    }
    ]
};

/*
exports.dashboard = {

    path: '/dashboard',
    validate: function (request) {
    },

    children: [
    {
        view: require('../root/RootV'),
        region: 'rootR',

        children: [
        {
            view: require('../dashboard/DashboardV'),
            region: 'main',

            children: [
            {
                view: require('../dashboard/daily/RevenueWidgetV'),
                region: 'revenue',
            },

            {
                view: require('../dashboard/daily/ADRWidgetV'),
                region: 'adr',
            },

            {
                view: require('../dashboard/daily/RevParWidgetV'),
                region: 'revPar',
            },

            {
                view: require('../dashboard/daily/OccupancyWidgetV'),
                region: 'occupancy',
            },
            {
                view: require('../dashboard/daily/RoomNightsWidgetV'),
                region: 'roomNights',
            },
            
            //{
            //    view: require('../dashboard/daily/PaxWidgetV'),
            //    region: 'pax',
            //},

            {
                view: require('../dashboard/daily/InventoryWidgetV'),
                region: 'inventory',
            },

            {
                view: require('../dashboard/summary/Date-DatePrevious-WidgetV'),
                region: 'date-date-previous',
            },

            {
                view: require('../dashboard/summary/Date-DateLY-WidgetV'),
                region: 'date-date-ly',
            },
            {
                view: require('../dashboard/summary/MTD-MTDLY-WidgetV'),
                region: 'mtd-mtd-ly',
            },
            {
                view: require('../dashboard/summary/YTD-YTDLY-WidgetV'),
                region: 'ytd-ytd-ly',
            },

            {
                view: require('../dashboard/map/MapWidgetV'),
                region: 'map',
            },

            {
                view: require('../dashboard/social-media/SocialMediaWidgetV'),
                region: 'social-media',
            },
            {
                view: require('../dashboard/social-media/TripadvisorWidgetV'),
                region: 'tripadvisor',
            },
            {
                view: require('../dashboard/social-media/WebsiteWidgetV'),
                region: 'website',
            },
            {
                view: require('../dashboard/costs/ChartCostsDepartmentalV'),
                region: 'chart-costs-departmental',
            },
            {
                view: require('../dashboard/costs/TableCostsDepartmentalV'),
                region: 'table-costs-departmental',
            },

            {
                view: require('../dashboard/costs/GOPWidgetV'),
                region: 'gop',
            },
            {
                view: require('../dashboard/costs/GOPParWidgetV'),
                region: 'gopPar',
            },
            {
                view: require('../_common/views/FooterV'),
                region: 'footer',
            },
            ],
        }
        ]
    }
    ]
};


exports.primavera = {

    path: '/config/primavera',
    validate: function (request) {

    },

    children: [
    {
        view: require('../root/RootV'),
        children: [
        {
            view: require('../primavera-config/PrimaveraV'),
            region: 'main',
            children: [
            {
                view: require('../_common/views/FooterV'),
                region: 'footer',
            },
            ],

        }
        ]
    }
    ]
};


exports.tabularReports = {

    path: '/tabular-reports/:pdfFile',
    validate: function (request) {

    },

    children: [
    {

        view: require('../root/RootV'),
        children: [
        {
            view: require('../reports/TabularReportsV'),
            region: 'main',

            children: [
            {
                view: require('../_common/views/FooterV'),
                region: 'footer',
            },
            ],

        }
        ]
    }
    ]

};


exports.qlikReports = {

    path: '/qlik/:reportType',
    validate: function (request) {

    },

    children: [
    {
        view: require('../root/RootV'),
        region: 'rootR',
        children: [
        {
            view: require('../reports/QlikReportsV'),
            region: 'main',

            children: [
            {
                view: require('../_common/views/FooterV'),
                region: 'footer',
            },
            ],
        }
        ]
    }
    ]

};

// detailed view for revenue 

exports.revenue = {

    path: '/revenue',
    validate: function (request) {

    },

    children: [
    {

        view: require('../root/RootV'),
        region: 'rootR',

        children: [
        {
            view: require('../revenue/RevenueV'),
            region: 'center',
        }
        ]
    }
    ]

};
*/

// the initial/empty routes will simply make a redirection

exports.empty = {

    path: '',
    validate: function(request) {
//debugger
        setTimeout(() => { global.location.hash = '/dashboard' }, 0);
        return false;
    }
};

exports.emptyWithSlash = {

    path: '/',
    validate: function(request) {
//debugger
        setTimeout(() => { global.location.hash = '#/dashboard' }, 0);
        return false;
    }
};


// catch-all route

exports.catchAll = {

    path: '*any',
    validate: function(request) {
//debugger
        alert('Invalid page. You will be redirected to the welcome screen');

        setTimeout(() => { global.location.hash = '#/dashboard' }, 0);
        return false;
    },

};

