const mysql = require('mysql');

module.exports = function (req, res, next) {
    req.isJSON = isJSON;
    res.locals.currentYear = (new Date()).getFullYear();

    res.data = data;
    res.database = database;
    res.success = success;
    res.sendError = sendError;
    res.tryAdmin = tryAdmin;
    res.tryLogged = tryLogged;
    res.sendUserError = sendUserError;
    res.sendUserMessage = sendUserMessage;
    next();

    ////////////////

    /**
     * Tells us if the request is JSON
     */
    function isJSON() {
        return (req.header('accept') && req.header('accept').indexOf('json') > -1) ||
            (req.header('content-type') && req.header('content-type').indexOf('json') > -1);
    }

    /**
     * Returns data as JSON
     * 
     * @param {any} data Data to return
     * @param {boolean} success flag
     * @param {string} message Message field
     */
    function data(data, success, message) {
        if(typeof success === 'undefined'){
            success = true;
        }

        if(typeof message === 'undefined'){
            message = null;
        }
        
        res.json({
            success: success,
            message: message,
            data: data
        });
    }

    /**
     * Gives database access
     * 
     * @param {boolean} autoconnect
     * @returns {IConnection} Database object
     */
    function database(autoconnect) {
        if (typeof autoconnect === 'undefined') {
            autoconnect = true;
        }

        var connection = mysql.createConnection(config.database);
        if (autoconnect) {
            connection.connect();
        }

        return connection;
    }

    /**
     * Shorthand to return success:true
     * 
     * @param {string} message Optional message
     * @param {any} data Optional data
     */
    function success(message, data) {
        if(typeof data === 'undefined') {
            data = null;
        }

        res.data(data, true, message);
    }

    /**
     * JSON or visual error
     * 
     * @param {any} error Message to show
     * @param {any} data Optional data
     */
    function sendError(error, data) {
        if(typeof data === 'undefined') {
            data = null;
        }

        if(req.isJSON()) {
            res.data(data, false, error);
        } else {
            next(typeof error === 'object' ? error : new Error(error));           
        }
    }

    /**
     * Sends an user error, with a flash variable.
     * 
     * @param {string} message Message to show
     * @param {string} url Optional URL redirect
     */
    function sendUserError(message, url) {
        if(req.isJSON()) {
            res.set('Content-Type', 'application/json');
            res.status(400);
            res.sendError(message, {location: url});
        } else {
            req.flash('error', message);
            res.redirect(url || '');
        }
    }

    /**
     * Sends an user message with a flash variable.
     *
     * @param {string} message Message to show.
     * @param {string} url Optional URL redirect
     */
    function sendUserMessage(message, url) {
        if(req.isJSON()) {
            res.set('Content-Type', 'application/json');
            res.success(message, {location: url});
        } else {
            req.flash('message', message);
            res.redirect(url || '');
        }
    }

    /**
     * Tests if there's a session and if the user is an admin
     * Throws an exception if conditions are not met
     */
    function tryAdmin() {
        res.tryLogged();
        if(!req.session.info.isAdmin) {
            var err = new Error('No autorizado');
            err.status = 401;
            throw err;
        }
    }

    /**
     * Checks for a session. Throws an exception if there isn't.
     */
    function tryLogged() {
        if(!req.session.logged) {
            var err = new Error('Sesión no iniciada');
            err.status = 401;
            throw err;
        }
    }
};