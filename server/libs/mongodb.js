const mongoose = require('mongoose');
const log = require('./logger');
const config = require('../config/configuration');

log.info('Initialize MongoDB ...');
const url = config.mongo.url;
mongoose.connect(url);

mongoose.Promise = global.Promise;

module.exports = mongoose;
