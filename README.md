
# 第九章 会员管理及微信授权登录

通过前几章小程序的UI实践，我们小黄书的Home页面已经有一个基本的呈现。但是，所有的数据还都只是mock模拟的数据，还没有任何跟小黄书服务器进行交互的动作。

今天开始，我们会逐步增加小程序和服务器的交互。首先，我们会从后台对客户端会员登录的支持开始。

参考小红书应用，它大体支持以下几种会员的登录方式：

- 通过手机号和验证码进行登录
- 通过手机号和密码进行登录，其中密码是在后期绑定进去，而不是注册时设定的。比如先通过手机号和验证码进行登录，然后再对密码进行绑定，下次就能通过手机号和密码进行登录了。
- 通过第三方授权进行登录，比如微信，新浪微博等

因为我们现在的客户端只有小程序，ios和android的客户端将会在往后进行实现，所以我们第一步先不会实现所有这些会员登录方式。

这里会先对以下两种会员登录方式进行实现：

- 通过手机号和验证码进行登录
- 通过小程序进行微信授权登录

需要注意的是，我们这里并不需要特意的区分开注册和登录。无论是哪种登录方式，只要是之前没有注册过的，都会自动进行注册，然后进行登录。

# 1. 会员管理
---
要实现会员登录，我们首先需要在服务器上支持上会员的操作，比如增删改查。

# 1.1. 会员mongoose模型及静态方法
首先，参考我们之前对User的支持，我们需要定义好会员这个mongoose的实体模型。

``` js
const MemberSchema = new Schema({
  nickname: { type: String, default: '小黄人', required: true },   // 名字。会员昵称
  password: String,
  avatar: String,                                                 // 头像
  realname: String,                                               // 姓名
  birth: String,                                                  // 生日
  gender: String,                                                 // 性别。可选值：男， 女
  address: String,                                                // 地址
  status: { type: String, default: 'registered' },                // 会员状态。可选值：registered|cancelled（已注册|已注销）
  bindings: {
    type: {
      wechat: {
        type: {
          nickname: String,
          avatar: String,
          openid: String,
          country: String,
          province: String,
          city: String,
        },
        required: false,
      },
      mobile: {
        type: {
          number: String,
        },
        required: false,
      },
    },
    select: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
```
这里我们除了定义会员的姓名地址等信息之外，最重要的是还定义了两个绑定信息：一个是微信的绑定信息，另外一个就是手机的绑定信息。分别代表了我们上面提及的两种会员登录的情况。

- 如果我们是通过手机号和验证码注册的，那么一开始的时候我们只有绑定的手机号信息。在后期我们可以绑定密码等信息，这样的话，会员就可以通过手机号和密码直接登录，而不需要每次都通过手机号和验证码进行登录了。因为用手机进行注册的时候，没有携带任何用户的其他信息，所以这里我们默认将昵称设置成“小黄人”。同时，在ios或者安卓客户端，我们还可以在通过手机号码登录后，和微信进行绑定。但这要等到我们事先这些客户端时再进行实现。

- 如果我们是通过微信小程序进行注册的，那么一开始的时候我们只有绑定的微信用户相关的信息。在后期我们可以绑定手机号等信息，这样在其他客户端进行手机号登录的时候，就能和微信小程序这边的登录统一起来。同时，因为微信登录的时候我们可以获得微信的头像和昵称等信息，所以我们会将绑定的微信用户的昵称等信息同步到跟bindings字段同级的昵称等信息。这样一来，当其他客户端进行登录时，就能自动同步头像和昵称等信息。

同时，我们为会员的schema定义两个静态的方法，以便更方便的通过会员的手机号或者微信的openid来获得会员的信息:

``` js

MemberSchema.statics.findByOpenId = function(wxOpenId) {
  return this.findOne({'bindings.wechat.openid': wxOpenId});
}

MemberSchema.statics.findByMobieNumber = function(mobile) {
  return this.findOne({'bindings.mobile.number': mobile});
}
```

# 1.2. 会员路由

在会员的路由中，我们不需要实现增加会员的路由，因为这是在登录的过程中完成的。参考我们比较早的User登录的实现，我们往下将会在auth这个认证路由中实现。

同时，我们在这个阶段不会实现修改会员信息的功能。

### 1.2.1. 获取所有会员信息

``` js
/**
 路由功能: 获取所有会员列表
 访问权限: 平台管理员
 **/
router.get('/', async (req, res, next) => {
  try {
    if (req.user.type !== 'platform') {
      throw new ClientError.ForbiddenError();
    }
    let query = {};
    const members = await Member.find(query);
    res.json(members);
  } catch (e) {
    next(e);
  }
});
```
这里要注意的是，我们只允许平台管理用户有权利获取会员的所有信息。

在往下描述中我们可以看到，在授权中间件中，我们会将登录用户或会员的信息存储在Express请求的req.user中。我们将登录用户的类型分成两类：

- platform: 平台类型用户。也就是我们往后要实现的通过angularjs实现的后台管理平台的操作用户。我们在之前章节中已经实现了User平台用户的管理操作。
- member：会员。就是我们通过小程序等各个客户端进行登录的用户。

### 1.2.2. 获取会员详细信息

``` js
/**
 路由功能: 获取指定会员信息
 访问权限: 所有用户和会员
 **/
router.get('/:id', async (req, res, next) => {
  try {
    let query = {};
    if ((req.params.id)) {
      query = {_id: req.params.id};
    } else {
      res.status(400).send('Bad Request');
      return;
    }

    const member = await Member.findOne(query)
        .select('+bindings');

    if (!member) {
      res.status(404).send('Not Found.');
      return;
    }

    res.json(member);
  } catch (e) {
    next(e);
  }
});
```
因为会员的schema中，我们将bindings的select选项设置成false，所以我们在查找的api中显式的指定将bindings的信息取回来。

### 1.2.3. 删除会员

``` js
/**
 路由功能: 删除指定会员
 访问权限: 平台管理员
 **/
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.type !== 'platform') {
      throw new ClientError.ForbiddenError();
    }

    let query = {};
    if ((req.params.id)) {
      query = {_id: req.params.id};
    } else {
      res.status(400).send('Bad Request');
      return;
    }

    const member = await Member.findOne(query);
    if (!member) {
      log.warn('member not found');
      next();
      return;
    }

    await member.remove();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
```
同样，只有平台管理员才能删除会员。

# 2. 会员登录
---

## 2.1. 手机号码和验证码登录
在之前的章节中，我们已经实现了手机短信验证码的功能：

> 客户端通过提供手机号码调用服务器端相应的sms的api，相应的短信服务商将会把验证码以指定的模板发送到指定的手机号码上。且会将该验证码保存在redis指定的时间。详情请往回查看相应的章节。

当客户端获取到服务器端发过来的验证码的时候，我们就可以通过同时提供手机号码和验证码来调用auth模块的signin接口来进行登录操作。

``` js
router.post('/signin', async (req, res, next) => {
  try {
    const {mobile, smscode, wxcode, encryptedData, iv} = req.body;
    
    // 通过手机号和验证码登录
    if (mobile && smscode) {
      // 检查验证码是否有效
      const redis_code = await redis.getAsync(mobile);

      if (redis_code !== smscode) {
        throw new ClientError.VerificationCodeIncorrect();
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
      ...
  }catch (e) {
    log.error('Exception:',e);
    next(e);
  }
});
```

通过手机号码和验证码进行登录的流程是这样的：

- 获取客户端发送过来的手机号码和验证码
- 根据手机号码，获取到上面提及的在发送sms验证码时存储在redis上的验证码
- 验证客户端提供的验证码和redis存储的验证码是否一致，如果不一致的话，给客户端返回相应错误
- 通过手机号码到mongose数据库查找对应的会员信息
- 如果会员不存在，那么根据提供的手机号码注册一个新的会员
- 为登录的会员或者新注册的会员生成访问凭证
- 将访问凭证和登录会员的关键信息保存到redis中。我们往下的**授权中间件会在每个需要授权访问的api请求过来时，将这些用户关键信息取出来，挂到req.user中，以便在对应的路由中进行使用。**
- 将访问凭证返回给客户端

## 2.2. 授权中间件挂载用户信息
紧跟着我们对之前实现的路由中间件进行修改。在对应的api需要授权的时候，我们先从redis中根据客户端提供的访问凭证，取得上面描述的在登录过程中存储在redis上的关键的用户/会员信息，并挂到req.user上面。这样的话，在对应实现该api的路由中，就能通过访问req.user来获取到当前用户的关键信息了。

``` js
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
```

这里我们整理下，客户端从登录到发起一个请求的过程是怎样的:

- 客户端通过向服务器发起一个获取验证码的请求
- 服务器端将验证码通过短信运营商发送给客户端，同时将手机号码和验证码作为键值存储在redis上，并设置一定的过期时间(比如10分钟)，表明该时间段内该验证码都是有效的。
- 客户端获取到验证码后，将手机号码和验证码一并发给服务器进行登录操作
- 服务器登录完成后，将会员关键信息以访问凭证为键保存到redis中，并把访问凭证返回给客户端
- 客户端通过该访问凭证发起一个需要授权的请求，比如获取笔记列表
- 授权中间件根据过来的访问凭证，从redis中获取到上面的会员id和类型等关键信息，并将该关键信息挂到请求的req.user上面
- 请求的处理路由从req.uer中获取到对应用户信息，并判断是否有足够的权限来执行该请求

## 2.3. 微信授权登录小程序

### 2.3.1 微信授权登录简述
所谓登录，就是通过客户端提供的用户的登录凭证，验证其凭证的有效性，在通过验证后将访问凭证返回给客户端，让客户端和服务端通过该凭证来进行通信。

所以登录的关键要素就是:

- 一个可以标识用户身份的id： 比如手机号码
- 一个可验证有效性的登录凭证： 比如短信验证码


通过手机号码和短信验证码进行登录时，我们是用手机号和验证码作为登录凭证。服务器端验证手机号对应的保存在redis缓存上的验证码和客户端传过来的验证是否一致来验证有效性，然后将访问凭证返回给客户端来作为通信凭据。

那么微信授权登录小程序的时候，我们又是用什么作为标识用户身份的id和用什么作为登录凭证呢？这里我们可以参考微信小程序登录相关的描述:
[https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-login.html#wxloginobject](https://mp.weixin.qq.com/debug/wxadoc/dev/api/api-login.html#wxloginobject)


![小程序登录时序图](http://upload-images.jianshu.io/upload_images/264714-8b5c1967944b8d6f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

从中我们可以看到，小程序客户端只需要调用wx.login获取一个登录凭证的code，然后发给服务器端去处理，就能完成登录的流程。

那么，为什么只是提供一个code就能完成登录流程呢? 不是说登录需要两个关键要素吗？此时在我们的脑海中，应该存在以下几个问题：

- 这个code的有效性是可验证的吗？

- 我们登录的另外一个用于身份标识的关键要素在哪里呢？怎么客户端没有提供出来？

事实上，解答这些问题的信息都已经隐含在这个登录凭证code里面了:

- 服务器端会通过code到微信服务器去换取用户身份的标识，也就是微信用户在小程序上的openid。这就解答了为什么客户端不需要单独的提供一个叫做openid的会员身份凭证

- 服务器端在通过code到微信服务器去换取用户身份的标识的时候，微信服务器会验证这个code的有效性，只有有效的code才能正确的换取到微信用户的身份信息。这就解答了我们怎么验证这个code的有效性的问题了。只是这个验证不是我们的服务器端来做的，是委托微信服务器来做的。

至于上面小程序登录时序图中的3rd_session的处理，其实就是我们此前描述的auth模块中的访问凭证access_token的工作方式。

### 2.3.2. 小黄书小程序微信授权登录简述
如果我们只是为了实现简单的登录并获得访问凭证的话，上面的流程就已经足够了。

但是这里还存在一个问题，就是我们需要的不仅仅是openid这个用户凭证，我们还需要获得微信头像和性别等信息以存储在数据库中。

微信开发文档并没有提供方法让我们通过openid直接获取到微信用户的头像等信息。

所以，这里会好的做法是微信小程序客户端除了提供一个登陆凭证code之外，还能提供上微信用户的基本信息的数据结构。

事实上，小程序在调用wx.login之后，如果在调用wx.getUserInfo就能获得微信用户的关键信息。

| 参数        | 类型           | 说明
| ------------- |:-------------:| -----:|
| userInfo | OBJECT | 用户信息对象，不包含 openid 等敏感信息|
| rawData| String|不包括敏感信息的原始数据字符串，用于计算签名。|
| signature| String|使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息，参考文档 [signature](https://mp.weixin.qq.com/debug/wxadoc/dev/api/signature.html)。|
| encryptedData| String|包括敏感数据在内的完整用户信息的加密数据，详细见[加密数据解密算法](https://mp.weixin.qq.com/debug/wxadoc/dev/api/signature.html#加密数据解密算法)|
| iv| String|加密算法的初始向量，详细见[加密数据解密算法](https://mp.weixin.qq.com/debug/wxadoc/dev/api/signature.html#加密数据解密算法)|

其中encryptedData中包含的信息会比较详尽，但是里面的内容是加密过的。虽说我们现在不一定需要用到这么详尽的信息，但是为了今后的可扩展性，我们还是有必要将其解密出来。

如果我们的小程序有通过开放平台（注意是开放平台）跟公众号进行绑定的话，我们还可以获得在公众号和小程序上相同的unionid。

``` json
{
    "openId": "OPENID",
    "nickName": "NICKNAME",
    "gender": GENDER,
    "city": "CITY",
    "province": "PROVINCE",
    "country": "COUNTRY",
    "avatarUrl": "AVATARURL",
    "unionId": "UNIONID",
    "watermark":
    {
        "appid":"APPID",
    "timestamp":TIMESTAMP
    }
}
```
要在服务器端解密encryptedData，我们需要提供三个关键要素:

- **appId**: 小程序的appid，我们可以在配置中指定
- **iv** : 加密算法的初始向量。就是上面的wx.getUserInfo调用成功时返回的其中一个参数
- **session_key**: 服务器端通过code到微信服务器换取openid的时候，同时还会得到一个session_key，这个session_key就是专门用来解密微信提供的这些加密数据用的

``` js
{     session_key: 'oS6eJ9A1NiEEuDMr2Q9GsQ==',
      expires_in: 7200,
      openid: 'ovN8b0aJY2bi49DVVVMAP6sz4mV0' }
```

那么我们的小黄书小程序微信授权登录的流程应该如下:

- 微信客户端通过wx.login获取到code
- 微信客户端通过wx.getUserInfo获取到加密了openid等微信用户关键信息的encryptedData。
- 微信客户端将code和encryptedData发送到服务器端
- 服务器端根据code从微信服务器获取到代表该用户的openid和用于解密encryptedData的session_key。如果获取失败，代表登录失败
- 如果解密失败，证明提供的code获取的session_key不能正确的解密出encryptedData中的openid，登录失败
- 解密成功后，验证通过code获取到的openid时候和encryptedData中的openid一致。如果不一致，登录失败
- 登录成功，生成访问凭证并返回给客户端

### 2.3.3. 获取微信用户openid和session_key

在小程序上调用wx.login接口时，微信服务器会返回一个登录凭证code。小程序将这个code发送给我们的服务器，我们就可以通过这个code去微信服务器换取到对应的openid和session_key了。

``` js
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
```
返回来的结果：
``` 
    response: { session_key: 'oS6eJ9A1NiEEuDMr2Q9GsQ==',
      expires_in: 7200,
      openid: 'ovN8b0aJY2bi49DVVVMAP6sz4mV0' }
```

### 2.3.4. 解密客户端提供的微信用户关键信息
如前面的描述，我们需要通过code获得的session_key才能对加密后的encryptedDataj进行解密。除了session_key之外，我们还需要提供小程序的appId和一个叫做初始验证向量iv的值，而这个值也是小程序中通过wx.getUserInfo获取到的。

具体的解密算法请查看微信官方提供的描述：
https://mp.weixin.qq.com/debug/wxadoc/dev/api/signature.html

同时微信官方也为我们提供了解密需要用到的库，在上面的连接中我们可以找到WXBizDataCrypt这个库。根据所提供的nodejs版本的解密示例，我们的解密代码将会如下:

``` js
// 根据session_key和iv解密加密会员信息
      const wXBizDataCrypt = new WXBizDataCrypt(confidential.xiaochengxu.appid, response.session_key)
      const userInfo = wXBizDataCrypt.decryptData(encryptedData , iv)
```

### 2.3.5. 验证解密是否成功及openid是否一致

解密后，我们就可以验证解密是否成功，以及解密后的数据和通过code获取的数据是否一致了。

``` js
    // 如果解密失败或者解密后的openid和通过code获取到的openid不一致,登录失败
      if(!userInfo.openId || userInfo.openId !== response.openid) {
        throw new ClientError.InvalidWxLoginError();
      }
```

### 2.3.6. 新会员注册
如果登录会员的openid在数据库中不存在的话，我们需要先对其进行注册。

``` js
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
```

# 2.4. 完整的登录流程代码参考

``` js
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
```

# 3. 结语
---

详细实现请查看github中的代码。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH09
- npm install 
- **gulp dev**

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
