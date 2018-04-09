'use strict';

let Path = require('path');
let Config = require('nconf');

let internals = {};

exports.logCallsite = function logCallsite (callsiteObj) {

    let colors = internals.sgrColors;

    // callsiteObj is an array of strings, prepared by Hoek (not the origin callsite obj, which has methods like .getLineNumber())
    let funcName = (callsiteObj[3] || 'anonymous') + '()';
    let lineNumber = callsiteObj[1];
    let dirName = Path.dirname(callsiteObj[0]);
    let baseName = Path.basename(callsiteObj[0]);

    // output will be colored in blue and green, with something like:
    //
    // getClientCode() (/home/user/path/to/file.js:123)

    let output = `

        ${ colors.bold.cyan }${ funcName }${ colors.reset } (${ dirName }/${ colors.bold.cyan }${ baseName }${ colors.reset }:${ colors.bold.green }${ lineNumber }${ colors.reset })

    `

    internals.server.log(['stack'], output.trim());
};

exports.setServer = function setServer (server){

    internals.server = server;
};


exports.getClientCode = function getClientCode (token){

    return Config.get('clientTokens')[token];
};

exports.logErr = function (err, tags){

    tags = tags || [];
    tags.push('error');

    // we consider 3 types of error objects: 
    // 1) general errors 
    // 2) postgres errors 
    // 3) boom errors

    // base log object; for the particular cases of pg or boom errors, we add more properties
    let logObj = { 
        message: err.message,
        stack: err.stack
    };

    if (internals.isBoomError(err)){
        tags.push('boom');
        ['data', 'isServer', 'output', 'reformat'].forEach(key => { logObj[key] = err[key] });
    }
    else if (internals.isPgError(err)) {
        tags.push('pg');
        ['name', 'length', 'severity', 'code', 'detail', 'hint', 'position', 'internalPosition', 'internalQuery', 'where', 'schema', 'table', 'column', 'dataType', 'constraint', 'file', 'line', 'routine'].forEach(key => { logObj[key] = err[key] });
    }
    else {
        tags.push('general');
    }

    internals.server.log(tags, logObj);
};

internals.isBoomError = function (err) {

    return err.isBoom    
};

internals.isPgError = function (err) {

    let pgErrorAttrs = ['name', 'length', 'severity', 'code', 'detail', 'hint', 'position', 'internalPosition', 'internalQuery', 'where', 'schema', 'table', 'column', 'dataType', 'constraint', 'file', 'line', 'routine'];
    let count = 0;

    for (let key in err) {
        if (pgErrorAttrs.indexOf(key) >= 0) {
            count++;
        }
    }

    return count > 0;
};

// see https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters
internals.sgrColors = {

    'reset': '\x1b[0m',

    'black': '\x1b[30m',
    'red': '\x1b[31m',
    'green': '\x1b[32m',
    'yellow': '\x1b[33m',
    'blue': '\x1b[34m',
    'magenta': '\x1b[35m',
    'cyan': '\x1b[36m',
    'white': '\x1b[37m',

    bold: {
        'black': '\x1b[30;1m',
        'red': '\x1b[31;1m',
        'green': '\x1b[32;1m',
        'yellow': '\x1b[33;1m',
        'blue': '\x1b[34;1m',
        'magenta': '\x1b[35;1m',
        'cyan': '\x1b[36;1m',
        'white': '\x1b[37;1m',
    }
};

