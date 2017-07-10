const fs = require('fs');
const path = require('path');
const express = require('express');
const debug = require('debug')('3ds-themes:loader');
const config = require('../config.json');
let rpath = path.join(__dirname, 'routes');

/**
 * Loads recursively all the route modules
 * inside the API's routes folder (/server/routes)
 */
function fun(app) {
    debug('Loading route modules...');

    let files = walkSyncJS(rpath);
    files.forEach((file) => {
        let mod = file.substr(0, file.length-3).replace(rpath+path.sep, '');
        if(config.exclude && config.exclude.indexOf(mod) > -1) {
            return;
        }

        app.use(require(file));
        debug('Loading server' + file.replace(__dirname, ''));
    });

    debug('Route modules loaded');
}

/**
 * Retrieves all the JS files inside a path
 */
function walkSyncJS(dir) {
    let files = fs.readdirSync(dir);
    let filelist = [];
    files.forEach(function(file) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            filelist = filelist.concat(walkSyncJS(fullPath));
        } else if(file.endsWith('.js')) {
            filelist.push(fullPath);
        }
    });

    return filelist;
}

module.exports = fun;