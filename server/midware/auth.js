const uuid = require('uuid');

const redis = require('../libs/redisdb');
const log = require('../libs/logger');
const ClientError = require('../errors/ClientError');
const config = require( '../config/configuration');

const User = require('../models/User');

const authMidware = async (req, res, next) => {
    try {
      const accessToken = req.headers.authorization;
      log.debug('accessToken:', accessToken)

      // APIS need no authentication
      if (req.path === '/'
          || req.path === '/v1/auth/login') {

        log.debug('no auth required');
        next();

        return;
      }

      // APIS need authentication
      if (accessToken) {
        const user = await redis.getAsync(accessToken);
        if (!user) {
          throw new ClientError.InvalidTokenError();
        } else {
          req.user = JSON.parse(user);
          await redis.expireAsync(accessToken, config.auth.ttl);
          next();
        }
      } else {
        throw new ClientError.InvalidTokenError();
      }
    } catch (e) {
      log.debug('error while auth', e);
      next(e);
    }
};

module.exports = authMidware;
