const express = require('express');
const User = require('../models/User');
const Member = require('../models/Member');
const log = require('../libs/logger');
const ClientError = require('../errors/ClientError');
const redis = require('../libs/redisdb');
const router = express.Router();
const uuid = require('uuid');
const config = require('../config/configuration');
const confidential = require('../config/confidential');
const request = require('request-promise');
const WXBizDataCrypt = require('../libs/WXBizDataCrypt');

const generateAccessToken = () => {
    const accessToken = uuid.v4();
    return accessToken;
};

router.post('/signin', async (req, res, next) => {
  try {
    const {mobile, smscode, wxcode, encryptedData, iv} = req.body;
    log.debug('mobile:',mobile,'smscode:',smscode, 'wxcode:',wxcode, 'encryptedData:',encryptedData, 'iv:',iv);

    // 通过手机号和验证码登录
    if (mobile && smscode) {
      // 检查验证码是否有效
      const redis_code = await redis.getAsync(mobile);
      log.debug(`smscode save in redis for mobile:${mobile} is: ${redis_code}`)

      if (!config.run_mode.is_debug) {
        if (redis_code !== smscode) {
          throw new ClientError.VerificationCodeIncorrect();
        }
      }

      // 检查注册会员手机号是否已经存在, 不存在的话先注册
      let member = await Member.findByMobieNumber(mobile);
      log.debug('member:',member);
      if (!member) {
        // 保存新注册会员信息
        const data = {
          nickname: config.member.default_nickname,
          bindings: {
            mobile: {
              number: mobile
            }
          },
        }

        member = new Member(data);
        member.save();
      }

      // 生成会员访问凭证并返回给客户端
      const auth = {
        id: member.id,
        type: 'member',
        ttl: config.auth.ttl.member,
      }
      const accessToken = generateAccessToken();
      await redis.setAsync(accessToken, JSON.stringify(auth));
      await redis.expireAsync(accessToken, config.auth.ttl.member);

      res.send({"access_token": accessToken});
    } else if (wxcode && encryptedData && iv) {
      // 通过wxcode获取到微信用户的openid 和 session_key
      const options = {
        url: 'https://api.weixin.qq.com/sns/jscode2session',
        method: 'GET',
        json: true,
        qs: {
          grant_type: 'authorization_code',
          appid: confidential.xiaochengxu.appid,
          secret: confidential.xiaochengxu.secret,
          js_code: wxcode
        }
      };
      const response = await request(options);
      log.debug('response:',response);

      if (response.errcode) {
        throw new ClientError.GetOpenIdError();
      }

      // 根据session_key和iv解密加密会员信息
      const wXBizDataCrypt = new WXBizDataCrypt(confidential.xiaochengxu.appid, response.session_key)
      const userInfo = wXBizDataCrypt.decryptData(encryptedData , iv)

      log.debug('encryptedData: ', userInfo);

      // 如果解密失败或者解密后的openid和通过code获取到的openid不一致,登录失败
      if(!userInfo.openId || userInfo.openId !== response.openid) {
        throw new ClientError.InvalidWxLoginError();
      }

      // 检查会员openid是否存在, 不存在的话先注册
      let member = await Member.findByOpenId(userInfo.openId);
      log.debug('member:',member);
      if (!member) {
        // 保存新注册会员信息
        const data = {
          nickname:  userInfo.nickName,
          avatar: userInfo.avatar,
          gender: userInfo.gender === 1 ? '男' : '女',
          bindings: {
            wechat: {
              openid: response.openid,
              nickname: userInfo.nickName,
              gender: userInfo.gender === 1 ? '男' : '女',
              avatar: userInfo.avatar,
              country: userInfo.country,
              city: userInfo.city
            }
          },
        }

        member = new Member(data);
        member.save();
      }

      // 生成会员访问凭证并返回给客户端
      const auth = {
        id: member.id,
        type: 'member',
        ttl: config.auth.ttl.member,
      }
      const accessToken = generateAccessToken();
      await redis.setAsync(accessToken, JSON.stringify(auth));
      await redis.expireAsync(accessToken, config.auth.ttl.member);

      res.send({"access_token": accessToken});
    }


  }catch (e) {
    log.error('Exception:',e);
    next(e);
  }
});



router.post('/login', async (req, res, next) => {
  try {
    const {name, password} = req.body;

    const user = await User.findOne({name});

    if (!user.authenticate(password)) {
      throw new ClientError.InvalidLoginError();
    } else {
      const accessToken = generateAccessToken();

      const auth = {
        id: user.id,
        type: 'platform',
        ttl: config.auth.ttl.user,
      }
      await redis.setAsync(accessToken, JSON.stringify(auth));
      await redis.expireAsync(accessToken, config.auth.ttl.user);
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
