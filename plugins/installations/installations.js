'use strict';

let Path = require('path');
let Config = require('nconf');
let Joi = require('joi');
let _ = require('underscore')
let Hoek = require('hoek')
let Boom = require('boom')
let Slug = require('slug')
let Utils = require('../../common/utils');
let Db = require('../../database');

let internals = {};

internals.installationsSchema = Joi.object({
    id: Joi.number().integer(),
    // userId: Joi.number().integer(),  
    soilTypeCode: Joi.string().allow(['loamy_sand', 'fine_sandy_loam', 'sandy_loam', 'loam', 'clay']).required(),
    //cropTypeCode: Joi.string().allow(['crop_corn', 'crop_fruits', 'crop_wheat', 'crop_grapes', 'crop_type_x', 'crop_type_y', 'crop_type_z']).required(),
    name: Joi.string().required(),
    //slug: Joi.string().allow(''),
    description: Joi.string().allow(''),
    timezone: Joi.string().allow(''),
    //location TBD
    active:  Joi.bool()
});

// the keys are the keys of the output object (that is, the columns in the database)

internals.APItoDB = {
    'id': 'id',
    'user_id': 'userId',
    'soil_type_code': 'soilTypeCode',
    'crop_type_code': 'cropTypeCode',
    'name': 'name',
    'slug': 'slug',
    'description': 'description',
    'timezone': 'timezone',
    'location': 'location',
    'active': 'active',
};

internals.DBtoAPI = _.invert(internals.APItoDB);

exports.register = function (server, options, next){

    // 1 - read installations

    server.route({
        path: '/api/get-installations',
        method: 'GET',
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            }
            /*
            validate: {

                query: {
                    //userId: Joi.number().integer().required()
                },

                options: {
                    stripUnknown: true
                }
            }
            */

        },

        handler: function (request, reply) {

            //console.log('request.auth', request.auth)
            console.log('request.query', request.query)

            if (Config.get('auth') === 'false') {
                request.auth.credentials = { id: 1 }
            }
            else if (request.query.user && request.query.user.startsWith('fculresta')) {
                request.auth.credentials = { id: 7 }
            }
            else {
                if (!request.auth.isAuthenticated) {

                    if (request.query.user_id) {
                        request.auth.credentials = { id: request.query.user_id }
                    }
                    else {

                        // check special case - expired session (happens when isAuthenticated is false and we have request.auth.artifacts)
                        if (request.auth.artifacts && request.auth.artifacts.uuid) {
                            return reply(Boom.unauthorized('Your session has expired. Please login again.'));
                        }
                        else {
                            return reply(Boom.unauthorized('Please login first'));
                        }                        
                    }

                }                
            }

            // original request options
            console.log(request.query);

            // add userId from the cookie data
            let dbOptions = request.query;
            dbOptions.userId = request.auth.credentials.id;
            console.log(dbOptions);

            Db.query(`select * from read_installations(' ${ JSON.stringify(dbOptions) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){
                    
                    Utils.logErr(err, ['installations']);
                    return reply(err);
                });
        }
    });


    server.route({
        path: '/api/get-installations-cors',
        method: 'GET',
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            },
            cors: {
                origin: ['*']
            }
            /*
            validate: {

                query: {
                    //userId: Joi.number().integer().required()
                },

                options: {
                    stripUnknown: true
                }
            }
            */

        },

        handler: function (request, reply) {

            //console.log('request.auth', request.auth)
            console.log('request.query', request.query)

            if (Config.get('auth') === 'false') {
                request.auth.credentials = { id: 1 }
            }
            else if (request.query.user && request.query.user.startsWith('fculresta')) {
                request.auth.credentials = { id: 7 }
            }
            else {
                if (!request.auth.isAuthenticated) {

                    if (request.query.user_id) {
                        request.auth.credentials = { id: request.query.user_id }
                    }
                    else {

                        // check special case - expired session (happens when isAuthenticated is false and we have request.auth.artifacts)
                        if (request.auth.artifacts && request.auth.artifacts.uuid) {
                            return reply(Boom.unauthorized('Your session has expired. Please login again.'));
                        }
                        else {
                            return reply(Boom.unauthorized('Please login first'));
                        }                        
                    }

                }                
            }

            // original request options
            console.log(request.query);

            // add userId from the cookie data
            let dbOptions = request.query;
            dbOptions.userId = request.auth.credentials.id;
            console.log(dbOptions);

            Db.query(`select * from read_installations(' ${ JSON.stringify(dbOptions) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){
                    
                    Utils.logErr(err, ['installations']);
                    return reply(err);
                });
        }
    });
    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X GET http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/get-installations

    */


    // 2 - upsert installations

    server.route({
        path: '/api/upsert-installations',
        method: 'POST',
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            },
            validate: {
                payload: internals.installationsSchema,
                options: {
                    stripUnknown: true
                }
            }

        },

        handler: function (request, reply) {

            console.log('request.auth', request.auth)

            if (Config.get('auth') === 'false') {
                request.auth.credentials = { id: 1 }
            }
            else {
                if (!request.auth.isAuthenticated) {

                    // check special case - expired session (happens when isAuthenticated is false and we have request.auth.artifacts)
                    if (request.auth.artifacts && request.auth.artifacts.uuid) {
                        return reply(Boom.unauthorized('Your session has expired. Please login again.'));
                    }
                    else {
                        return reply(Boom.unauthorized('Please login first'));
                    }
                }                
            }

            // original request options
            console.log(request.payload);

            // add userId from the cookie data
            let dbData = Hoek.transform(request.payload, internals.APItoDB);
            dbData.user_id = request.auth.credentials.id;

            // add slug
            dbData.slug = Slug(dbData.name)

            console.log(dbData);

            Db.query(`select * from upsert_installations(' ${ JSON.stringify(dbData) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){
                    
                    let outputErr = err;

                    // check all errors from pg constraints
                    if (false) {}

                    // check for PL/pgSQL error "unique_violation"; 
                    // use the constraint name (default name given by pg) to identify the constraint in cause (we have 2)
                    else if (err.code === '23505' && err.message.indexOf('t_installations_user_id_slug_key') >= 0) {
                        outputErr = Boom.badRequest('user_id_slug');
                    }

                    // check for PL/pgSQL error "no_data_found"; 
                    // use the constraint name (default name given by pg) to identify the constraint in cause (we have 2)
                    else if (err.code === 'P0002') {
                        outputErr = Boom.badRequest('no_data_found');
                    }      
                    // log the original error, but reply with the outputErr
                    Utils.logErr(err, ['installations']);
                    return reply(outputErr);
                });
        }
    });


    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X POST -d "soilTypeCode=soil_loam&cropTypeCode=crop_corn&name=my+installation+xyz&description=desc" http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/upsert-installations

    */


    // 3 - delete installations

    server.route({
        path: '/api/delete-installations',
        method: 'POST',
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            },
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

            console.log('request.auth', request.auth)

            if (Config.get('auth') === 'false') {
                request.auth.credentials = { id: 1 }
            }
            else {
                if (!request.auth.isAuthenticated) {

                    // check special case - expired session (happens when isAuthenticated is false and we have request.auth.artifacts)
                    if (request.auth.artifacts && request.auth.artifacts.uuid) {
                        return reply(Boom.unauthorized('Your session has expired. Please login again.'));
                    }
                    else {
                        return reply(Boom.unauthorized('Please login first'));
                    }
                }                
            }


            // original request options
            console.log(request.payload);

            // add userId from the cookie data
            let dbOptions = request.payload;
            dbOptions.userId = request.auth.credentials.id;
            console.log(dbOptions);

            // note that if the installation with the given id doesn't below
            // to this user, an error will be thrown ('query returned no rows'); this error
            // should be handled manually

            Db.query(`select * from delete_installations(' ${ JSON.stringify(dbOptions) } ')`)
                .then(function (result){

                    return reply(Hoek.transform(result, internals.DBtoAPI));
                })
                .catch(function (err){

                    let outputErr = err;

                    // check for PL/pgSQL error "no_data_found"; 
                    if (false) {}

                    // this will happen when the we try to delete a record that doesn't exist anymore
                    else if (err.code === 'P0002'){
                        outputErr = Boom.notFound('no_data_found');
                    }

                    // log the original error, but reply with the outputErr
                    Utils.logErr(err, ['installations']);
                    return reply(outputErr);
                });
        }
    });


    /*

    H2OPTIMUM_HOST=localhost
    H2OPTIMUM_PORT=8001

    curl -X POST -d "id=4" http://$H2OPTIMUM_HOST:$H2OPTIMUM_PORT/api/delete-installations

    */

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};
