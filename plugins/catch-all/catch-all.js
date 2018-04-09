'use strict';

let Path = require('path');
let Boom = require('boom');

exports.register = function (server, options, next){

    // manual catch-all route

    // we explicitely list all the http method (instead of using "*") 
    // to make sure this route is more specific

    server.route({
        method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        path: "/{any*}",        
        handler: function(request, reply){
            
            return reply(Boom.notFound("Invalid endpoint."));
        }
    });

    return next();
};

exports.register.attributes = {
    name: Path.parse(__dirname).name,  // use the name of the file
    dependencies: [/* */]
};

