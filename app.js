/*jshint node:true*/
'use strict';
var fs = require('fs-extra'),
    config = require('./config'),
    express = require('express'),
    path = require('path'),
    favicon = require('serve-favicons'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    http = require('http'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    mongoStore = require('connect-mongo')(session),
    passport = require('passport'),
    passportLocalMongoose = require('passport-local-mongoose'),
    LocalStrategy = require('passport-local').Strategy,
    mongoose = require('mongoose');


var app = express();

function onDatabaseConnected() {

    if(process.env['NODE_ENV'] !== 'dev'){
        process.env['NODE_ENV'] = 'production';
    }
    // Uncomment for debugging
    // process.env['NODE_ENV'] = 'DEV';

    global.appRoot = path.resolve(__dirname);

    app.config = config;

    app.server = http.createServer(app);

    require('./models')(app, mongoose);


    /**
    *  Serve favicon images
    **/

    // app.use(favicon({
    //     '/apple-touch-icon-57x57.png': __dirname + '/favicons/apple-touch-icon-57x57.png',
    //     '/apple-touch-icon-60x60.png': __dirname + '/favicons/apple-touch-icon-60x60.png',
    //     '/apple-touch-icon-72x72.png': __dirname + '/favicons/apple-touch-icon-72x72.png',
    //     '/apple-touch-icon-76x76.png': __dirname + '/favicons/apple-touch-icon-76x76.png',
    //     '/apple-touch-icon-114x114.png': __dirname + '/favicons/apple-touch-icon-114x114.png',
    //     '/apple-touch-icon-120x120.png': __dirname + '/favicons/apple-touch-icon-120x120.png',
    //     '/apple-touch-icon-144x144.png': __dirname + '/favicons/apple-touch-icon-144x144.png',
    //     '/apple-touch-icon-152x152.png': __dirname + '/favicons/apple-touch-icon-152x152.png',
    //     '/apple-touch-icon-180x180.png': __dirname + '/favicons/apple-touch-icon-180x180.png',
    //     '/favicon-32x32.png': __dirname + '/favicons/favicon-32x32.png',
    //     '/favicon-194x194.png': __dirname + '/favicons/favicon-194x194.png',
    //     '/favicon-96x96.png': __dirname + '/favicons/favicon-96x96.png',
    //     '/android-chrome-192x192.png': __dirname + '/favicons/android-chrome-192x192.png',
    //     '/favicon-16x16.png': __dirname + '/favicons/favicon-16x16.png',
    //     '/manifest.json': __dirname + '/favicons/manifest.json',
    //     '/safari-pinned-tab.svg': __dirname + '/favicons/safari-pinned-tab.svg',
    //     '/mstile-144x144.png': __dirname + '/favicons/mstile-144x144.png'
    // }));


    /**
    *   Configure Session / Auth
    **/

    app.use(session({
        resave: true,
        saveUninitialized: true,
        secret: config.sessionSecret,
        store: new mongoStore({ mongooseConnection: app.db })
    }));

    app.use(methodOverride());
    app.use(cookieParser(config.cookieSecret));
    app.use(passport.initialize());
    app.use(passport.session());

    // passport config
    // app.db.models.Account = require('./schema/account');
    // app.db.models.Account.plugin(passportLocalMongoose);
    passport.use(new LocalStrategy(app.db.models.Account.authenticate()));
    passport.serializeUser(app.db.models.Account.serializeUser());
    passport.deserializeUser(app.db.models.Account.deserializeUser());

    app.set('port', config.port);
    app.set('views', path.join(__dirname, 'views'));

    // app.use(logger('dev'));
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
    // app.use(cors());

    // switch (app.get('env')) {
    var staticOptions = {
        maxage: 31536000000
    };

    switch(process.env.NODE_ENV){
        case 'production': {
            app.use(express.static(path.join(__dirname, '/adminBuild'), staticOptions));
            app.use(express.static(path.join(__dirname, '/displayBuild'), staticOptions));
            app.use('/src/client', express.static(path.join(__dirname, 'src/client')));
            app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));
            break;
        }
        default: {
            app.use('/src/client', express.static(path.join(__dirname, 'src/client')));
            app.use('/.adminTmp', express.static(path.join(__dirname, '.adminTmp')));
            app.use('/.displayTmp', express.static(path.join(__dirname, '.displayTmp')));
            app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
            app.use('/material-icons', express.static(path.join(__dirname, 'material-icons')));
            app.use('/img', express.static(path.join(__dirname, 'img')));
            break;
        }
    }

    require('./routes')(app, passport);

    //setup utilities
      app.utility = {};
      app.utility.workflow = require('./util/workflow');


    // server.on('error', onError);
    // app.server.on('listening', onListening);

    // catch 404 and forward to error handler
    // app.use(function (req, res, next) {
    //     var err = new Error('Not Found');
    //     err.status = 404;
    //     next(err);
    // });

    // error handlers

    // development error handler
    // will print stacktrace
    // if (app.get('env') === 'development') {
    //     app.use(function (err, req, res, next) {
    //         res.status(err.status || 500)
    //             .json({
    //                 message: err.message,
    //                 error: err
    //             });
    //     });
    // }

    // production error handler
    // no stacktraces leaked to user
    // app.use(function (err, req, res, next) {
    //     res.status(err.status || 500)
    //         .json({
    //             message: err.message,
    //             error: {}
    //         });
    // });

    // function onListening() {
    //     var addr = app.server.address();
    //     var bind = typeof addr === 'string'
    //         ? 'pipe ' + addr
    //         : 'port ' + addr.port;
    //     debug('Listening on ' + bind);
    // }

    app.server.listen(config.port);

}

app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  onDatabaseConnected();
});