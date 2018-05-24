var Backbone = require('backbone');
var Radio = require('backbone.radio');
var Utils = require('../_common/utils');

var PrimaveraHeaderM = Backbone.Model.extend({

    initialize: function(){

    },

    idAttribute: 'Id',

    defaults: {
        Code: null,
        ColorCode: null,
        DataSource: null,
        Deleted: null,
        Description: null,
        Description2: null,
        Description3: null,
        GroupId: null,
        Id: 0,
        RowNumber: null,
        SortOrder: null,
        TotalRows: null,

        // computed fields
        GroupCode: null,
        GroupDescription: null,
    },

});

var PrimaveraHeadersC = Backbone.Collection.extend({
    model: PrimaveraHeaderM,
    url: Host.rootPath + '/api/v1/statistics/ConfigGetBiPrimaveraItemHeadersA',
    comparator: 'Id',

    parse: function(response){

        if (response.success === false) { return [] }

        // late binding for the groups collection
        var primaveraGroupsC = Radio.channel('data').request('primaveraGroupsC');

        response.data.forEach(obj => {

            var groupM = primaveraGroupsC.get(obj.Id);
            if (groupM === undefined ) { return }

            //obj.GroupModel = group;
            obj.GroupCode = groupM.get('Code');
            obj.GroupDescription = groupM.get('Description');
        })

        return response.data;
    }
});

module.exports = PrimaveraHeadersC;
