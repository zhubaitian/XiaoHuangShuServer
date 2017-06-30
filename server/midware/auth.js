const uuid = require('uuid');

const redis = require('../libs/redisdb');
const log = require('../libs/logger');
const ClientError = require('../errors/ClientError');
const config = require( '../config/configuration');

const User = require('../models/User');

const authMidware = async (req, res, next) => {
    try {
        const accessToken = req.headers.authorization;
        log.debug('accessToken:', accessToken);

        if (req.path === '/favicon.ico') {
            res.status(404).end();
            return;
        }

        // APIS need no authentication
        if (req.path === '/'
            || req.path === '/v1/auth/login'
            || req.path === '/v1/pingpp/webhooks'
            || req.path === '/v1/auth/register'
            || req.path === '/v1/auth/signin'
            || (req.path === '/v1/members' && req.method === 'GET')
            || req.path.startsWith('/v1/pingpp/channel/')
            || req.path.startsWith('/v1/uploads')) {

            log.debug('no auth required');
            next();

            return;
        }

        // APIS need authentication
        if (accessToken) {
            const user = await redis.getAsync(accessToken);
            log.debug('user:', user);
            if (!user) {
                throw new ClientError.InvalidTokenError();
            } else {
                req.user = JSON.parse(user);
                await redis.expireAsync(accessToken, req.user.ttl);
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
