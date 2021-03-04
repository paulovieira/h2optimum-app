'use strict';

console.log('hello world');

require('./config/load');
require('./config/promisify');

const Fs = require('fs');
const Path = require('path');
const Config = require('nconf');
const Glue = require('glue');
const Hoek = require('hoek');
const Chalk = require('chalk');
const Bluebird = require('bluebird');
const Db = require('./database');
const Utils = require('./common/utils');

process.title = Config.get('applicationTitle');

const manifest = {

    server: {

        //  default connections configuration
        connections: {

            // controls how incoming request URIs are matched against the routing table
            router: {
                isCaseSensitive: false,
                stripTrailingSlash: true
            },

            // default configuration for every route.
            routes: {
                state: {
                    // determines how to handle cookie parsing errors ("ignore" = take no action)
                    failAction: 'ignore'
                },

                // disable node socket timeouts (useful for debugging)
                timeout: {
                    server: false,
                    socket: false
                }
            }
        },

        cache: {
            name: 'memory-cache',
            engine: require('catbox-memory')
        }
    },

    connections: [
        {
            address: 'localhost',
            port: Config.get('port')
        }
    ],

    registrations: [

        // https://github.com/USER/REPOSITORY/tree/vX.Y.Z
        // dependencies: ['...']
        // {
        //     plugin: {
        //         register: '...',
        //         options: Config.get('plugins:...')
        //     },
        //     options: {}
        // },


        // https://github.com/hapijs/good/tree/v7.3.0
        // https://github.com/hapijs/good-console/tree/v6.4.1
        // https://github.com/hapijs/good-squeeze/tree/v5.0.2
        // {
        //     plugin: {
        //         register: 'good',
        //         options: Config.get('plugins:good')
        //     },
        //     options: {}
        // },


        // https://github.com/danielb2/blipp/tree/v2.3.0
        {
            plugin: {
                register: 'blipp',
                options: Config.get('plugins:blipp')
            },
            options: {}
        },


        // https://github.com/hapijs/inert/tree/v4.2.1
        {
            plugin: {
                register: 'inert',
                options: {}
            },
            options: {}
        },


        // https://github.com/hapijs/vision/tree/v4.1.1
        {
            plugin: {
                register: 'vision',
                options: {}
            },
            options: {}
        },


        // https://github.com/dafortune/hapi-qs/tree/v1.1.3
        {
            plugin: {
                register: 'hapi-qs',
                options: {}
            },
            options: {}
        },

        // https://github.com/hapijs/hapi-auth-cookie/tree/v6.1.1
        {
            plugin: {
                register: 'hapi-auth-cookie',
                options: {}
            },
            options: {}
        },

        // dependencies: ['hapi-auth-cookie']
        {
            plugin: {
                register: 'hapi-auth-cookie-cache',
                options: Config.get('plugins:hapi-auth-cookie-cache')
            },
            options: {}
        },

        /*

        // dependencies: []
        {
            plugin: {
                register: './plugins/catch-all/catch-all.js',
                options: {}
            },
            options: {}
        },
*/

        {
            plugin: {
                register: './plugins/routes-login//routes-login.js',
                options: {}
            },
            options: {}
        },

        // dependencies: ['vision', 'inert', 'hapi-auth-cookie-cache']
        // {
        //     plugin: {
        //         register: './plugins/dashboard/dashboard.js',
        //         options: {}
        //     },
        //     options: {}
        // },
        {
            plugin: {
                register: './plugins/dashboard-2/dashboard-2.js',
                options: {}
            },
            options: {}
        },

        // dependencies: []
        {
            plugin: {
                register: './plugins/installations/installations.js',
                options: {}
            },
            options: {}
        },

        // dependencies: []
        {
            plugin: {
                register: './plugins/devices/devices.js',
                options: {}
            },
            options: {}
        },
    ]

};


const glueOptions = {
    relativeTo: __dirname,

    // called prior to registering plugins with the server
    preRegister: function (server, next){

        // make sure the logs directory exists
        try {
            Fs.mkdirSync(Path.join(Config.get('rootDir'), 'logs'));    
        }
        catch (err){
            if (err.code !== 'EEXIST'){
                throw err;
            }
        }

        next();
    },

    // called prior to adding connections to the server
    preConnections: function (server, next){

        next();
    }
};

Glue.compose(manifest, glueOptions, function (err, server) {

    Hoek.assert(!err, 'Failed registration of one or more plugins: ' + err);
/*
    server.app.meteoCache = server.cache({ segment: 'meteo', expiresIn: 10 * 1000 });

    server.app.meteoCache.getAsync = Bluebird.promisify(server.app.meteoCache.get, { multiArgs: true });
    server.app.meteoCache.setAsync = Bluebird.promisify(server.app.meteoCache.set);

//    server.app.meteoCache.getAsync = Bluebird.promisify(server.cache({ segment: 'meteo', expiresIn: 10*1000 }), {multiArgs: true});
*/

    // start the server and finish the initialization process
    Utils.setServer(server);
    server.start( function (err){

        Hoek.assert(!err, 'Failed server start: ' + err);
        
        // show some basic informations about the server
        console.log(Chalk.cyan('================='));
        console.log('hapi version:', server.version);
        console.log('host:', server.info.host);
        console.log('port:', server.info.port);
        console.log('process.env.NODE_ENV:', process.env.NODE_ENV);


        Db.query('SELECT version()')
            .then((result) => {
                
                console.log('database:', result[0].version);
                console.log(Chalk.cyan('================='));
            });

    });
});

