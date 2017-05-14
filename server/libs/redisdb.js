const bluebird = require('bluebird');
const redis = bluebird.promisifyAll(require('redis'));
const log = require('./logger');
const config = require('../config/configuration');

log.info('Initialize Redis Database ...');

const redisClient = redis.createClient(config.redis.port, config.redis.host);

module.exports = redisClient;