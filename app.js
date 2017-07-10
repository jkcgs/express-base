//////
const express = require('express');
const path = require('path');
const fs = require('fs');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const http = require('http');
const debug = require('debug')('3ds-themes:app');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const flash = require('express-flash');
const hbs = require('hbs');
const passport = require('passport');
const expressValidator = require('express-validator');
const db = require('./server/database');
let config = require('./config.json');
global.config = config;
//////

db.authenticate()
    .then(function(err) {
        debug('Connected to the database.');
    })
    .catch(function (err) {
        debug('Could not connect to the database.');
        debug(err);
        process.exit(1);
    });

// Create server
let app = express();
let server = http.Server(app);
let io = socketio(server);

// Setup sessions
let sessionStore = new MySQLStore(config.database);
app.use(session({
    secret: config.sessionSecret,
    saveUninitialized: false,
    resave: false,
    store: sessionStore
}));
app.use(flash());

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(require('./server/lib/app-utils'));
app.use(cookieParser());
app.use(expressValidator());

// Statics folder
/*
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist')));
app.use('/assets/css', express.static(path.join(__dirname, 'node_modules', 'font-awesome', 'css')));
app.use('/assets/fonts', express.static(path.join(__dirname, 'node_modules', 'font-awesome', 'fonts')));
app.use('/assets/js', express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use(favicon(path.join(__dirname, 'public', 'assets', 'fav', 'favicon.ico')));
*/

// Template system (Handlebars)
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'server', 'views'));
hbs.registerPartials(path.join(__dirname, 'server', 'views', 'partials'));
require('./server/lib/handlebars-ops')(hbs);

// Passport - OAuth login
app.use(passport.initialize());
app.use(passport.session());

// Load routes
require('./server/loader')(app);

// 404 error
app.use(function (req, res, next) {
    if(!req.isJSON()) {
        res.status(404);
        return res.render('404');
    }

    var err = new Error('Not found');
    err.status = 404;
    next(err);
});

// Errors management
app.use(function (err, req, res, next) {
    if(!req.isJSON()) {
        var error = {
            title: err.name,
            desc: err.toString(),
            trace: config.development ? err.stack : null
        };

        res.status(err.status || 500);
        return res.render('error', {error: error}); // error
    }

    var errdata = !config.development ? null : {
        status: err.status,
        stack: err.stack
    };

    // Display error
    res.status(err.status || 500);
    res.sendError(err.message, errdata);
});

module.exports = {
    app: app,
    server: server
};