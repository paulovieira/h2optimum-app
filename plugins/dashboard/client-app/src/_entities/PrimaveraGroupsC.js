var Backbone = require('backbone');
var Utils = require('../_common/utils');

//var PrimaveraGroupM = require('./PrimaveraGroupM');
//  T_BI_PRI_Groups

var PrimaveraGroupM = Backbone.Model.extend({

    initialize: function(){

    },

    idAttribute: 'Id',

    defaults: {
        RowNumber: null,
        TotalRows: null,
        Id: 0,
        CompanyId: null,
        SortOrder: null,
        Code: null,
        Description: null,
        Deleted: null,
    },

});

var PrimaveraGroupsC = Backbone.Collection.extend({
    model: PrimaveraGroupM,
    url: Host.rootPath + '/api/v1/statistics/ConfigGetBiPrimaveraGroupsA',
    comparator: 'Id',

    parse: response => { return response.success ? response.data : [] },
});

module.exports = PrimaveraGroupsC;
