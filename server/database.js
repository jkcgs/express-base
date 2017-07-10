const Sequelize = require('sequelize');
const config = require('../config.json');
const debug = require('debug')('3ds-themes:db');

let sequelize = new Sequelize(
    config.database.database, 
    config.database.user, 
    config.database.password, 
    {
        host: config.database.host,
        dialect: 'mysql',
        logging: debug
    }
);

module.exports = sequelize;