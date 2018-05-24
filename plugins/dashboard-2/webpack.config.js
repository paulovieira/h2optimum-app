'use strict';

let Path = require('path');
let Webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let BellOnBundlerErrorPlugin = require('bell-on-bundler-error-plugin');
let CleanWebpackPlugin = require('clean-webpack-plugin')
let StringReplacePlugin = require('string-replace-webpack-plugin');

let internals = {};

internals.srcDir = Path.join(__dirname, 'client-app/src');
internals.buildDir = Path.join(__dirname, 'client-app/dist');

function getConfig(isProduction) {

    let outputFormat = isProduction ? '[name].[chunkhash:4]' : '[name]';

    let config = {

        entry: {
            'app': [

                Path.join(internals.srcDir, "index"),

                // dedicated module to requiring .css files that specific to the application
                // this way we get a separated css chunk for the application css
                // (so we'll have 1 css chunk for the app and 1 other css chunk for the libs)
                Path.join(internals.srcDir, '_config/require-styles-app.js')
            ],

            // "explicit vendor chunk (split your code into vendor and application);"
            // we must list here the modules that will be placed in lib.js
            // more info at:  https://webpack.github.io/docs/list-of-plugins.html#commonschunkplugin

            'lib': [

                'jquery',  // note that we have temporarily 2 versions of jquery (one global) - why?
                'underscore',
                'q',
                'backbone',
                'backbone.marionette',
                'backbone.radio',
                'backbone.call',
                //'./web_modules/backbone.call',  //'backbone.call',
                'backbone.syphon',
                'query-string',
                'nunjucks',
                'fecha',
                'flatpickr',
                'leaflet',
                //'britecharts',
                //'./web_modules/britecharts/britecharts.js',  // TODO: change to individual modules later
                //'d3-selection',
                'date-fns',
                
                //'popper.js',
                Path.resolve('./node_modules/popper.js/dist/umd/popper.js'),

                'bootstrap',
                Path.resolve('./web_modules/bootstrap-select/js/bootstrap-select.js'),

                //'perfect-scrollbar',
                Path.resolve('./web_modules/perfect-scrollbar/perfect-scrollbar.jquery.js'),
                
                

                //'billboard.js',
                //'metrics-graphics',
                'typeahead.js',
                'plotly.js/lib/index-cartesian',
                //'sweetalert2',
                
                // dedicated module to requiring .css files from third-party libs;
                // this way we get a separated css chunk for the libs
                // (so we'll have 1 css chunk for the app and 1 other css chunk for the libs)
                Path.join(internals.srcDir, '_config/require-styles-lib.js'),

                Path.resolve('./web_modules/theadmin/app-1.1.1-custom.js'), 

                Path.resolve('./web_modules/bootstrap-wizard/jquery.bootstrap.wizard-1.3.1-b0d182.js'),

            ],
        },


        output: {
            path: internals.buildDir,
            filename: outputFormat + '.js',
            chunkFilename: outputFormat + '.js'
        },

        module: {
            rules: [
            
                {
                    test: /\.js$/,
                    use: [
                        'ify-loader',
                        //'transform-loader?plotly.js/tasks/util/compress_attributes.js',
                    ]
                },
            

                // disable the AMD loader for everything; exceptions can be added explicitely
                // more info here: http://stackoverflow.com/questions/29302742/is-there-a-way-to-disable-amdplugin
    /**/
                {
                    test: /\.js$/,
                    exclude: /(d3-color)/,
                    use: {
                        loader: 'imports-loader',
                        options: {
                            'define': '>false'  
                        }

                        // an alternative would be to give the options directly as a query string, like this
                        // loader: 'imports-loader?define=>false',
                    }

                },


                // use babel; must install these 3 modules:
                // npm install babel-loader babel-core babel-preset-es2015 --save
    /*
                {
                    test: /\.js$/,
                    exclude: /(node_modules|web_modules)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            // https://github.com/babel/babel-loader#options
                            cacheDirectory: true,
                            presets: ['es2015']
                        }
                    }
                },
    */
                {
                    test: /\.css$/,
                    use: ExtractTextPlugin.extract({
                      fallback: "style-loader",
                      use: "css-loader"
                    })

                    // note: for webpack v1, to get a separate buddle with css + minify, we used something like this
                    //use: ExtractTextPlugin.extract(/*'style-loader',*/  'css-loader?' + JSON.stringify({ minimize: getCssNanoOptions() }))
                },


                // load/include small images inline

                { 
                    test: /\.(png|jpg|gif)$/,
                    use: {
                        loader: 'url-loader',
                        options: {
                            limit: 4096000,
                            //name: 'images/[name].[ext]'   // not valid anymore?
                        }
                    }
                },
        /*
        */

                // load/include load fonts (referenced in the stylesheets via "src: url('...')" )

                // note that Font Awesome font urls are of the format: [dot][extension]?=[version]
                // (example: 'fontawesome-webfont.woff?v=4.6.3')
                // the reg exp used here takes that into account (and can also be used
                // when there is no '?')
                {
                    test: /\.(ttf|eot|svg|woff|woff2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: {
                        loader: 'url-loader',    
                        options: {
                            limit: 1,
                            name: 'fonts/[name].[ext]',
                            // mimetype: 'application/font-woff'  

                            // note: mimetype is used only if the file is included in the chunk using 
                            // a data-uri, which happens if the size is <= limit
                        }
                    }
                },

                // handle jquery plugins that are not published as a proper module; they must be imported using imports-loader
                // https://github.com/webpack/imports-loader
                
                {
                    test: [
                        Path.resolve('node_modules/bootstrap/dist/js/bootstrap.js'),
                        Path.resolve('./web_modules/perfect-scrollbar/perfect-scrollbar.jquery.js'),
                        Path.resolve('./web_modules/theadmin/app-1.1.1-custom.js'),
                        Path.resolve('./web_modules/bootstrap-wizard/jquery.bootstrap.wizard-1.3.1-b0d182.js'),

                        //Path.resolve('node_modules/metrics-graphics/dist/metricsgraphics.js'),

                        
                        // Material design theme for Bootstrap
                        // https://github.com/FezVrasta/bootstrap-material-design

                        //Path.resolve('./web_modules/bootstrap-material-design/dist/js/material.js'),

                        //Path.resolve('./web_modules/material-kit/bootstrap-datepicker.js'),

                    ],
                    use: {
                        loader: 'imports-loader',
                        options: {
                            'jQuery': 'jquery',
                            '$': 'jquery'
                        }
                    }
                },
                

                // bootstrap 4 expects a global reference to Popper (from popper.js)
                
                {
                    test: [
                        Path.resolve('node_modules/bootstrap/dist/js/bootstrap.js'),
                        Path.resolve('./web_modules/theadmin/app-1.1.1-custom.js'),
                    ],
                    use: {
                        loader: 'imports-loader',
                        options: {
                            //'Popper': 'popper.js'  // don't use this otherwise we will be including the es module version
                            'Popper': 'popper.js/dist/umd/popper.js'
                            
                        }
                    }
                },
                
                {
                    test: /.html$/,
                    exclude: /node_modules/,
                    enforce: 'pre',
                    use: [
                        {
                            loader: 'raw-loader',
                        },
                        {
                            loader: 'htmlhint-loader',
                            options: {
                                configFile: Path.resolve('.htmlhintrc.js')
                            }
                        }
                    ]
                },

                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: { 
                        loader: StringReplacePlugin.replace({
                            replacements: [{
                                pattern: /\/\/\s*@insert-nunjucks-template/ig,
                                replacement: (match, offset, str) => {

                                    let output =  `
                                        /*** dynamic code - inserted in the StringReplacePlugin ***/ 
                                        
                                        var __Nunjucks = require('nunjucks');
                                        
                                        // the path for the module is using an alias; check resolve.alias in webpack config;
                                        var __env = require('_config/nunjucks-env'); 
                                        
                                        // loaded with the raw-loader; check module.rules in webpack config;
                                        var __templateSrc = require(__filename.replace('js', 'html'));
                                        
                                        module.exports.prototype.template = __Nunjucks.compile(__templateSrc, __env, null, true);
                                        
                                        // also add the filename to the prototype (useful for logging)
                                        module.exports.prototype.__filename = __filename;

                                        /*** end of dynamic code ***/ 
                                        
                                    `;
                                    
                                    return output;
                                }
                            }]
                        })
                    }
                },
                
            ]
        },
      
        plugins: [
            new CleanWebpackPlugin(internals.buildDir),
            new Webpack.NamedChunksPlugin(), 
            isProduction ? new Webpack.HashedModuleIdsPlugin() : new Webpack.NamedModulesPlugin(),

            //new Webpack.optimize.OccurrenceOrderPlugin(),

            new Webpack.optimize.CommonsChunkPlugin({
                name: ['lib'],  // should be same as the key in the 'entry' section
                minChunks: Infinity
            }),
            new Webpack.optimize.CommonsChunkPlugin({
               name: 'runtime'
            }),

            new BellOnBundlerErrorPlugin,
            new ExtractTextPlugin(outputFormat + '.css' /*, { allChunks: true }*/),
            new StringReplacePlugin()
        ],

        node: {
            __filename: true
        },
        
        resolve: {
            alias: {
                //'config': Path.resolve(__dirname, 'client-app/src/_config/'),

                '_config': Path.resolve('./client-app/src/_config/'),
                '_common': Path.resolve('./client-app/src/_common/'),
                '_entities': Path.resolve('./client-app/src/_entities/'),
            }
        }
    };

    return config
};


module.exports = function (env = {}) {

  return getConfig(env.production);
}


