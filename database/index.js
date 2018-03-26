'use strict';

const Config = require('nconf');
const Promise = require('bluebird');
const PgPromise = require('pg-promise');
const PgMonitor = require('pg-monitor');

const internals = {};

internals.pgpConfig = {
    promiseLib: Promise
};

// initialize the pg-promise library; 
internals.pgp = PgPromise(internals.pgpConfig); 

// activate postgres monitor; we must use the same configuration object that was used to initialize pg-promise;
if (String(Config.get('pg-monitor')) === 'true'){
    PgMonitor.attach(internals.pgpConfig);
}

// the main database/connection object; this will be the exported object (to used in the rest of the application)
internals.connection = internals.pgp({
    host:     Config.get('db:postgres:host'),
    port:     Config.get('db:postgres:port'),
    database: Config.get('db:postgres:database'),
    user:     Config.get('db:postgres:username'),
    password: Config.get('db:postgres:password'),
    application_name: Config.get('applicationTitle'),

    // advanced options:

    // ssl: ...,
    // binary: ...,
    // client_encoding: ...,
    // fallback_application_name: ...,
    // poolSize: ...,
});

module.exports = internals.connection;
