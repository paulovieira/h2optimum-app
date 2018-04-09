'use strict';

let Path = require('path');
let Config = require('nconf');
let Joi = require('joi');
let _ = require('underscore')
let Hoek = require('hoek')
let Boom = require('boom')
let Utils = require('../../common/utils');
let Db = require('../../database');

let internals = {};

internals.devicesSchema = Joi.object({
    id: Joi.number().integer(),
    // userId: Joi.number().integer(),  
    installationId: Joi.number().integer(),
    deviceTypeCode: Joi.string().allow(['device_sensor', 'device_irrigation']),
    mac: Joi.string(),
    activationKey: Joi.string().allow(''),
    description: Joi.string().allow(''),
    // last_reading: : Joi.date()
    active: Joi.bool()
});

// the keys are the keys of the output object (that is, the columns in the database)

internals.APItoDB = {
    'id': 'id',
    'user_id': 'userId',
    'installation_id': 'installationId',
    'device_type_code': 'deviceTypeCode',
    'mac': 'mac',
    'activation_key': 'activationKey',
    'description': 'description',
    'last_reading': 'lastReading',
    'active': 'active',
};

internals.DBtoAPI = _.invert(internals.APItoDB);

exports.register = function (server, options, next){

    // 1 - read devices

    server.route({
        path: '/api/get-devices',
        method: 'GET',
        config: {

            validate: {

                query: {
                    installationId: Joi.number().integer().required()
                },

                options: {
                    stripUnknown: true
                }
            }

        },

        handler: function (request, reply) {
            console.log('x')
            console.log(request.query);
            let userId = 1; // hardcoded for now (should be available from the authentication scheme)

            request.query.userId = userId;
            //let dbOptions = Hoek.transform(request.query, internals.APItoDB);
            let dbOptions = request.query;
            dbOptions.userId = userId;

            console.log(dbOptions);

            Db.query(`select * from read_devices(' ${ JSON.stringify(dbOptions) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){
                    
                    Utils.logErr(err, ['devices']);
                    return reply(err);
                });
        }
    });


    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X GET http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/get-devices?installationId=1

    */


    // 2 - upsert devices

    server.route({
        path: '/api/upsert-devices',
        method: 'POST',
        config: {

            validate: {
                payload: internals.devicesSchema,
                options: {
                    stripUnknown: true
                }
            }

        },

        handler: function (request, reply) {

            console.log(request.payload);
            let userId = 1; // hardcoded for now

            request.payload.userId = userId;
            let dbData = Hoek.transform(request.payload, internals.APItoDB);

            console.log(dbData);

            Db.query(`select * from upsert_devices(' ${ JSON.stringify(dbData) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){
                    
                    let outputErr = err;
//console.log("xxx", err.message)

                    // check all errors from pg constraints

                    // check for PL/pgSQL error "invalid_text_representation"; 
                    // this will happen when the we try to insert a mac address that is now well formed
                    if (err.code === '22P02' && err.message.indexOf('macaddr') >= 0){
                        outputErr = Boom.badRequest('mac_invalid_text_representation');
                    }

                    // check for PL/pgSQL error "unique_violation"; 
                    // use the constraint name (default name given by pg) to identify the constraint in cause (we have 2)
                    else if(err.code === '23505' && err.message.indexOf('t_devices_installation_id_mac_key') >= 0) {
                        outputErr = Boom.badRequest('installation_id_mac');
                    }
                    else if(err.code === '23505' && err.message.indexOf('t_devices_mac_activation_key_key') >= 0) {
                        outputErr = Boom.badRequest('mac_activation_key');
                    }

                    // check for PL/pgSQL error "no_data_found"; 
                    // use the constraint name (default name given by pg) to identify the constraint in cause (we have 2)
                    else if(err.code === 'P0002') {
                        outputErr = Boom.badRequest('no_data_found');
                    }      
                    // log the original error, but reply with the outputErr
                    Utils.logErr(err, ['devices']);
                    return reply(outputErr);
                });
        }
    });


    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X POST -d "installationId=1&deviceTypeCode=deviceSensor&mac=aabbccddeeff&activationKey=&description=desc" http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/upsert-devices

    */


    // 3 - delete devices

    server.route({
        path: '/api/delete-devices',
        method: 'POST',
        config: {

            validate: {
                payload: {
                    id: Joi.number().integer().required()
                },
                options: {
                    stripUnknown: true
                }
            }

        },

        handler: function (request, reply) {

            console.log(request.payload);
            let userId = 1; // hardcoded for now

            // note that if the device with the given id doesn't below
            // to this user, an error will be thrown ('query returned no rows'); this error
            // should be handled manually
            request.payload.userId = userId;
            let dbData = Hoek.transform(request.payload, internals.APItoDB);

            console.log(dbData);

            Db.query(`select * from delete_devices(' ${ JSON.stringify(dbData) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){

                    let outputErr = err;

                    // check for PL/pgSQL error "no_data_found"; 
                    // this will happen when the we try to delete a record that doesn't exist anymore
                    if (err.code === 'P0002'){
                        outputErr = Boom.notFound('no_data_found');
                    }

                    // log the original error, but reply with the outputErr
                    Utils.logErr(err, ['devices']);
                    return reply(outputErr);
                });
        }
    });


    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X POST -d "id=8" http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/delete-devices

    */

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
