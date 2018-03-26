var Backbone = require('backbone');
var Utils = require('../_common/utils');
var GuestM = require('./GuestM');

var GuestC = Backbone.Collection.extend({
    model: GuestM
});

module.exports = GuestC;
