'use strict';

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
        },
        config: {
            auth: {
                strategy: 'cookie-cache',
                mode: 'try'
            }
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