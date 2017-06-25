const express = require('express');
const log = require('../libs/logger');
const util = require('../libs/util');

const User = require('../models/User.js');
const ClientError = require('../errors/ClientError');
const router = express.Router();
const confidential = require('../config/confidential');

const PINGPP = require('pingpp');

const pingpp = new PINGPP(confidential.pingpp.key);
pingpp.setPrivateKeyPath(__dirname + '/../config/pingpp_rsa_private_key.pem');
function createCharge(orderInfo) {
  return new Promise((resolve, reject) => {
    pingpp.charges.create(orderInfo, (err, charge) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(charge);
    });
  }).catch(e => {
    log.error('e', e);
    throw e;
  });
}
/**
 创建支付凭据

 由移动端的 Ping++ 壹支付 SDK 发起

 TODO: 需要带入校验

 @route POST /notify/channel/pingpp/createCharge
 **/
router.post('/channel/createCharge', async (req, res, next) => {
  try {
    log.debug('create Charge:', req.body);
   /* // 1. get order info
    // 2. get vendor info
    // 3. get desk info？
    const orderNo = req.body.order_no;
    const clientIp = util.getIp(req);
    const channel = req.body.channel;
    // const appId = req.body.app_id || req.body.app.id;
    const appId = config.pingpp.appId;
    const amount = req.body.amount;
    const openId = req.body.open_id || req.body.extra.open_id;

    if (channel !== 'wx_pub') {
      res.status(400).send('Not support payment channel, only wx pub channel is support.');
      return;
    }

    if (channel === 'wx_pub' && !openId) {
      res.status(400).send('Missing open id');
      return;
    }

    const order = await Order.findOne({ order_no: orderNo });
    if (!order) {
      res.status(400).send('Invalid order no');
      return;
    }

    if (order.status !== 'created') {
      //res.status(400).send('Can\'t pay ' + order.status + 'order');
      throw new ClientError.OrderCompletedError();
    }

    // check if the item quantity still availabe
    for (const orderItem of order.items) {
      const item = await Item.findOne({ _id: orderItem.id });
      if (item.quantity < orderItem.quantity) {
        throw new ClientError.ItemOutOfStockError();
      }
    }

    const vendor = await Vendor.findOne({ _id: order.vendor_id });
    if (!vendor) {
      res.status(500).send('Invalid vendor');
      // TODO: this  should not happened
      return;
    }
    const orderSubject = vendor.name;
    const orderBody = `${vendor.name} ${order.order_no}`;
    const data = {
      vendor_id: vendor.id,
      order_no: orderNo,
      order_id: order.id,
      channel,
      amount: order.final_price,
      status: 'created',
    };
    const payment = new Payment(data);
    payment.payment_no = await sequenceIdService.getDayId();
    log.debug('payment', payment);
    await payment.save();
*/
   const channel = 'wx_pub';
    const ppData = {
      order_no: '123456789',
      app: { id: 'app_i5uvX5i18y540i9G' },
      channel: channel,
      amount: 1,
      client_ip: '127.0.0.1',
      currency: 'cny',
      subject: 'techgogogo月刊',
      body: '由Techgogogo科技有限公司出版的2017全年月刊',
    };
    if (channel === 'wx_pub') {
      ppData.extra = {
        open_id: 'oMv1_wBMyk3bP6DTDbQO_kqWstzc',
      };
    }
    log.debug('ppData', ppData);
    const charge = await createCharge(ppData);
    log.debug('charge', charge);
    if (!charge) {
      res.status(500).send('Failed to create charge from pingpp');
      return;
    }

    res.send(charge);
  } catch (e) {
    next(e);
  }
});

/**
 Ping ++ Webhooks 状态通知

 支付完成后，由 Ping++ 服务器回调支付结果

 @route POST /notify/channel/pingpp
 **/
router.post('/webhooks', async (req, res, next) => {
    try {
        log.debug('pingpp webhooks');
        log.debug('req.body:', req.body);

        res.send('OK');
    } catch (e) {
        // TODO: handle error
        //  mongo
        //  pingpp
        next(e);
    }
});

module.exports = router;