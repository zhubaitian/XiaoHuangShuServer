const express = require('express');
const User = require('../models/User');
const log = require('../libs/logger');
const ClientError = require('../errors/ClientError');
const redis = require('../libs/redisdb');
const router = express.Router();
const uuid = require('uuid');
const config = require('../config/configuration');

const generateAccessToken = () => {
    const accessToken = uuid.v4();
    return accessToken;
};

router.post('/login', async (req, res, next) => {
  try {
    const {name, password} = req.body;

    const user = await User.findOne({name});

    if (!user.authenticate(password)) {
      throw new ClientError.InvalidLoginError();
    } else {
      const accessToken = generateAccessToken();
      await redis.setAsync(accessToken, JSON.stringify(user));
      await redis.expireAsync(accessToken, config.auth.ttl);
      res.send({"access_token": accessToken});
    }

  } catch (e) {
    log.error('Exception:',e);
    next(e);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;
    await redis.delAsync(accessToken);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
