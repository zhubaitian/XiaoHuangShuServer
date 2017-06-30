const express = require('express');
const log = require('../libs/logger');
const sms = require('../libs/sms');
const router = express.Router();
const redis = require('../libs/redisdb');
const config = require('../config/configuration');

router.post('/code', async (req, res, next) => {
  try {
    const { mobile } = req.body;

    // 生成4位数字的随机数算法：Math.floor(Math.random() * (max - min + 1)) + min;
    var code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

    if(!config.run_mode.is_debug) {
      await sms.sendCode(mobile, code);
    }
    await redis.setAsync(mobile, code);
    await redis.expireAsync(mobile, 60 * 10);
    return res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
