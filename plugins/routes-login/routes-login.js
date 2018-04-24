'use strict';

let Nunjucks = require('nunjucks');
let Path = require('path');

let internals = {};

const DATA_NOT_SUBMITTED = 1;
const UNKNOWN_USERNAME = 2;
const WRONG_PASSWORD = 3;
const EXPIRED = 4;

internals.authFailReasons = {};
internals.authFailReasons[DATA_NOT_SUBMITTED] = 'Please submit the username or password';
internals.authFailReasons[UNKNOWN_USERNAME] = 'The submitted username does not exist';
internals.authFailReasons[WRONG_PASSWORD] = 'The submitted password is wrong';
internals.authFailReasons[EXPIRED] = 'Your session has expired. Please login again.';


exports.register = function(server, options, next){

    // configure nunjucks
    let env = Nunjucks.configure(__dirname, { 
        autoescape: false,
    });

    server.views({
        path: __dirname,
        engines: {
            html: {
                compile: (src, options) => {

                    var template = Nunjucks.compile(src, options.env);

                    return context => template.render(context)
                },
            }
        },

        compileOptions: {
            env,
        },

    });

    server.route({
        method: 'GET',
        path: '/login',
        handler: function (request, reply) {

            console.log('/login');

            if (request.auth.isAuthenticated) {
                return reply.redirect('/dashboard-auth/#');
            }

            const failReasonCode = request.query['auth-fail-reason'];
            const dynamicHtml = `<span style="background: red"> ${ internals.authFailReasons[failReasonCode] || '' } </span> <br><br>`;


            let templateFile = 'templates/login.html';
            let ctx = {
                //isProduction: !!Config.get('production'),
                abc: 123
            };

            reply.view(templateFile, {
                ctx
            });
            
            /*
return;
            
            const html = `
                <html><body>
                    <h1>H2Optimum</h1>
                    Access to your account<br><br>
                    <form method="post" action="/login-data">
                        Username: <input type="text" name="username"> <br>
                        Password: <input type="password" name="password"> <br>
                        <input type="submit">
                    </form>
                    ${ dynamicHtml }
                    <a href="/">Home</a>
                </body></html>
            `;

            return reply(html);
            
            */
        },
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            }
        }
    });


    // static files 
    
    server.route({
        path: "/login/static/{anyPath*}",
        method: "GET",
        config: {
            handler: {
                directory: { 
                    path: Path.join(__dirname, 'static'),
                    index: false,
                    listing: false,
                    showHidden: false,
                    lookupCompressed: true
                }
            },
            cache: {
                privacy: "public",
                expiresIn: 3600000
            },
            auth: false,
        }
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {

            return reply('You are being redirected...').redirect('/login');
        },
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: "routes-login",
    dependencies: ["hapi-auth-cookie-cache"]
};