var Backbone = require('backbone');
var Utils = require('../_common/utils');

var PrimaveraDetailM = Backbone.Model.extend({

    initialize: function(){

    },

    idAttribute: 'Id',

    defaults: {
        Account: null, 
        Code: null, 
        ColorCode: null, 
        CostCenter: null, 
        DataSource: null, 
        Deleted: false, 
        Description: null, 
        Description2: null, 
        Description3: null, 
        Formula: null, 
        HeaderId: null, 
        Id: 0, 
        Operation: null, 
        RowNumber: null, 
        Sign: null, 
        SqlQuery: 'Please save the item to preview the SQL', 
        TotalRows: null, 

        timestampId: 0
    },

});

var PrimaveraDetailsC = Backbone.Collection.extend({
    model: PrimaveraDetailM,
    url: Host.rootPath + '/api/v1/statistics/ConfigGetBiPrimaveraItemDetaisA',
    comparator: 'timestampId',

    parse: function(response){

        if (response.success === false) { return [] }

        // when we add a new model to this collection, it will have Id = 0 and timestampId = Date.now()
        // (a very large number); so the models will always be sorted by the date of insertion (the new detail
        // will be placed at the bottom of the table)
        response.data.forEach(obj => {

            obj.timestampId = obj.Id;
        })

        return response.data;
    }

});

module.exports = PrimaveraDetailsC;
