const request = require('request-promise');
const ClientError = require('../errors/ClientError');
const ServerError = require('../errors/ServerError');
const confidential = require('../config/confidential');
const log = require('./logger');

async function send(mobile, message) {
  try {
    const options = {
      url: 'https://sms-api.luosimao.com/v1/send.json',
      method: 'POST',
      auth: {
        user: 'api',
        pass: `key-${confidential.luosimao.apiKey}`,
      },
      form: {
        mobile,
        message,
      },
      json: true,
    };
    const response = await request(options);
    if (response.error !== 0) {
      throw new ClientError.SmsError();
    }
    return response;
  } catch (e) {
    log.error('Exception', e, e.stack);
    throw e;
  }
}

async function sendCode(mobile, code) {
  try {
    const message = `尊敬的用户，您的验证码是：${code}，请在10分钟内输入【techgogogo】`;
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
