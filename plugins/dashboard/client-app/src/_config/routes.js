
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

    path: '/groups/:installationSlug',
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
//debugger
                var requestData = viewOptions.request;
                viewOptions.request._ts = Date.now();
                var data = Radio.channel('public').request('installations');
                var dataFiltered = data.filter(obj => obj.slug === requestData.params.installationSlug)

                if (dataFiltered.length === 0) {
                    alert(`the installation ${ requestData.params.installationSlug } does not exist`);
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

