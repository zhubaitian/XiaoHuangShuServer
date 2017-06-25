const request = require('request-promise');
const ClientError = require('../errors/ClientError');
const confidential = require('../config/confidential');
const ServerError = require('../errors/ServerError');
const log = require('./logger');

async function send(mobile, text) {
  try {
    const options = {
      url: 'https://sms.yunpian.com/v2/sms/single_send.json',
      method: 'POST',
      form: {
        mobile,
        text,
        'apikey': confidential.yunpian.apiKey,
      },
      json: true,
    };
    const response = await request(options);
    if (response.code !== 0) {
      throw new ClientError.SmsError();
    }
    return response;
  } catch (e) {
    log.error('Exception:', e, e.stack);
    throw e;
  }
}

async function sendCode(mobile, code) {
    try {
        const message = `【小黄书科技】尊敬的用户，您的验证码是：${code}，请在10分钟内输入`;
        return await send(mobile, message);
    } catch (e) {
        log.error('Exception:', e);
        throw e;
    }
}

module.exports = {
    send,
    sendCode,
};
