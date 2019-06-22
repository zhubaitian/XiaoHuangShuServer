# 第五章 redis和鉴权

上一章我们通过引入mongodb实现了基本的用户管理，已经实现了异常处理的基本框架。今天我们会开始实现小红书后台的鉴权功能。

鉴权的主要目的就是为了:
> 让授权的用户访问相应的api资源，而禁止没有授权的用户去访问不属于它的资源。

现在比较流行的方案就是基于Token的鉴权方式， 请看知乎上的描述:
https://zhuanlan.zhihu.com/p/19920223?columnSlug=FrontendMagazine

基本的流程如下:

- 客户端用户通过提供用户名和密码进行登录

- 服务器端接收到用户名密码，生成一个唯一的Access Token令牌，代表这个用户的访问权限，并在本地存储起来（我们这里会用redis来存储到内存中，因为redis给我们提供了很好的令牌过期管理功能）

- 服务器将该令牌返回给客户端

- 客户端接收到令牌，并将其存储起来

- 客户端通过在http请求头的Authentication字段中提供令牌来访问服务器的资源

- 服务器收到请求后解析出http请求头的令牌，跟之前缓存起来的令牌进行对比，一致则允许访问相应的资源，否则返回授权失败

下面我们就开始进行实现。

# 1. REDIS客户端实现
---

首先，安装好Redis, 安装方法略...

其次，如果大家不是很熟悉Redis的话，请到官网进行学习:
https://github.com/NodeRedis/node_redis
上面有很多很好的实例，包含如何对redis进行异步调用。

跟上一章创建mongodb的客户端实例一样，我们这里需要创建Redis的实例来进行对Redis的访问。在libs目录下创建redisdb.js文件，实现代码如下:

``` js
const bluebird = require('bluebird');
const redis = bluebird.promisifyAll(require('redis'));
const log = require('./logger');

log.info('Initialize Redis Database ...');

const redisClient = redis.createClient('6379', '127.0.0.1');

module.exports = redisClient;
```

主旨就是:

- 通过bluebird来promise化redis的api调用，这样我们就能通过入setAsync的方式和结合es7的await/async来更简单的对redis进行操作

- 连上Redis服务器

- 将已经连接上Redis服务器的Redis客户端的实例export出去给其他模块使用

# 2. uuid和访问令牌
---
我们的访问令牌必须是唯一的，可以自己实现也可以使用第三方库。我们这里会用到uuid这个库:
https://github.com/kelektiv/node-uuid

## 2.1 登录时生成令牌并保存到redis

我们需要改造上一章实现的/auth/login路由:

- 首先，依然是检查用户名密码是否正确，不正确的话直接异常返回，否则往下走

- 然后，通过uuid库的接口创建一个唯一的uuid来代表我们的访问令牌

- 将该令牌保存到redis数据库中：其中令牌作为键，用户信息作为值。这样我们今后在需要的时候就能通过令牌来找到对应的用户信息。

- 设置令牌在redis中的过期时间。设置后，redis会自动帮我们做令牌的过期管理，一旦过期了，令牌就会被自动从redis中删除掉。比如我们这里设置令牌一小时后失效。

- 将访问令牌返回给客户端

代码实现如下:

``` js
router.post('/login', async (req, res, next) => {
  try {
    const {name, password} = req.body;

    const user = await User.findOne({name});

    if (!user.authenticate(password)) {
      throw new ClientError.InvalidLoginError();
    } else {
      const accessToken = generateAccessToken();
      await redis.setAsync(accessToken, JSON.stringify(user));
      await redis.expireAsync(accessToken, 3600);
      res.send({"access_token": accessToken});
    }

  } catch (e) {
    log.error('Exception:',e);
    next(e);
  }
});
```

## 2.2. 登出时删除redis中用户对应的令牌

如前面所述，用户登录之后，访问需要权限的资源的话，需要在http请求头的Authentication中设置上刚刚登录返回来的访问令牌。

登出时就需要携带这个令牌，所以我们在服务器端可以通过解析请求头来获得。

在获得访问令牌之后，我们这里就简单的将其从redis服务器中删除掉就好了。

``` js
router.post('/logout', async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;
    await redis.delAsync(accessToken);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
```

# 3. 鉴权
---
如上所述，鉴权的目的就是让有权限的用户访问对应的资源，没有权限的用户不能访问超出其权限的资源。

我们服务器端各个api就是用户需要访问的资源，所以鉴权必须要在路由到各个api之前做。所以最好的方法就是在server.js文件中，在通过bodyparser进行请求数据解析之后，而在分派路由之前，来提供一个中间件来实现:

``` js
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
bodyParserXML(bodyParser);
app.use(bodyParser.xml());

// 在这里实现鉴权中间件
app.use(async (req, res, next) => {
    ...
});

fs.readdir(`${__dirname}/routes/`, (err,files) => {
    for(const file of files) {
        const path = '/v1/' + file.split(".")[0];
        log.info('Attached  router:',path);
        app.use(path,require(`${__dirname}/routes/${file}`))
    }
})
```

由于我们当前只有一个Admin用户，也就是说我们只有两种用户：

- 提供了访问令牌的用户

- 没有提供访问令牌的用户

首先，我们需要获得用户传过来的http请求头中的访问令牌:

``` js
const accessToken = req.headers.authorization;
```

对于提供了访问令牌的用户，我们需要:
- 检查其访问令牌的有效性
- 更新访问令牌的过期时间，这样的话就不至于让我们的客户端在一直访问的过程中，到了令牌过期的时间后就需要重新登录。
- 鉴权通过后通过调用next来进入到对应的路由中间件进行请求处理
- 鉴权没有通过的话，抛出异常，然后通过next(e)来让系统默认错误处理中间件来进行处理

实现如下:

``` js
// APIS need authentication
      if (accessToken) {
        const user = await redis.getAsync(accessToken);
        if (!user) {
          throw new ClientError.InvalidTokenError();
        } else {
          req.user = JSON.parse(user);
          await redis.expireAsync(accessToken, 3600);
          next();
        }
      } else {
        throw new ClientError.InvalidTokenError();
      }
```

对于没有提供访问令牌的请求:
- 检查访问的是哪些API
- 对于不需要授权的api，调用next，让对应的路由中间件进行请求处理

代码实现如下:

``` js
      // APIS need no authentication
      if (req.path === '/'
          || req.path === '/v1/auth/login') {

        log.debug('no auth required');
        next();

        return;
      }
```

完整的鉴权中间件代码如下:

``` js
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
          await redis.expireAsync(accessToken, 3600);
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

# 4. 结语
---

重构后和完整的代码请从github中获取。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH05
- npm install 
- **gulp dev**


---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
