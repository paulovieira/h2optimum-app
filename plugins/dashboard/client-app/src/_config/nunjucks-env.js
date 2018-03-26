// mock the global object with the properties that are available in the browser;
// this is because this module will also be executed in the node runtime (see the 
// StringReplacePlugin in the webpack configuration) 

if (typeof global.Host === 'undefined') {
    global.Host = global.Host || {}
    global.location = global.location || {}
    global.location.hash = global.location.hash || '';
}

var Nunjucks = require('nunjucks');
var QS = require('query-string');
var _ = require('underscore');
var Radio = require('backbone.radio');
var Fecha = require('fecha');
var Utils = require('../_common/utils');

// create a nunjucks environment with no loaders and no options
var env = new Nunjucks.Environment([], {
    autoescape: false
});


env.addGlobal('currentFullYear', new Date().getFullYear());
env.addGlobal('areaPath', global.Host.areaPath || '');
env.addGlobal('areaFullPath', global.Host.areaFullPath || '');

// get the current path (hash component), which might include a fake (client side) query string
// optionally update some of the properties in the query string
env.addGlobal('currentPath', function(updateQS){

    // global.location.hash is expected to be something like #foo/bar?xyz=123&abc=false
    var pathComponents = global.location.hash.split('?');

    // simple case: no query string and nothing to update in the query string
    if (!pathComponents[1] && !updateQS){
        return pathComponents[0];
    }

    var newQS = _.extend(QS.parse(pathComponents[1]), updateQS);
    return pathComponents[0] + '?' + QS.stringify(newQS);
});

env.addGlobal('getCurrentLang', Utils.getCurrentLang);

env.addGlobal('Fecha', Fecha);

env.addFilter('getText', Utils.getText);

env.addFilter('plusOne', (num) => {

    return parseInt(num, 10) + 1;
});

env.addFilter('minusOne', (num) => {

    return parseInt(num, 10) - 1;
});

env.addFilter('_.template', function(str) {

    return (_.template(str))(this.ctx);
});

module.exports = env;
