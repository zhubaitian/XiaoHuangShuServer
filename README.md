# 第八章 手机短信验证码

上一章我们实现了将图片上传到又拍云上的功能。今天我们会实现手机验证码的功能。

我们现在到处都会碰到手机验证码的验证方式，比如在注册的时候，通过输入手机号码，获取一个验证码，然后输入完成注册。

# 1. 螺丝帽 vs 云片
---

一开始的时候，我们往往疲于短信服务商的选择。这里我选择了两个我觉得比较好的进行支持。

- 一个是螺丝帽: https://luosimao.com
- 一个是云片: https://www.yunpian.com

两者都提供了短信相关的很多功能，我这里只关心跟我们短信验证码相关的功能。

螺丝帽 vs 云片:

- **短信单条价格**:  初始价格都差不多，云片是￥0.050起，螺丝帽是￥0.055起。都会根据购买的量而下调单条短信的价格。
- **最少充值金额**:  云片是50块起充，螺丝帽是550块起充。
- **短信模板是否必须**: 根据我的实践，云片必须要申请好短信模板消息，验证短信才能发出去；而螺丝帽没有这个限制，不申请短信模板也能正常发出去。之所以把这个纳入比较范围，是因为申请模板是需要审核的，有时候审核不一定能够通过。

# 2. 云片
---

#2.1. 注册
云片注册页面如下，其他自便：
https://www.yunpian.com/

#2.2. 子账户和apikey

无论是云片还是螺丝帽，我们都需要apikey才能调用发送短信的api。

注册后，进入云片管理后台，你可以创建自己的子账号，每个子账号都会有对应的apikey来供你使用。

![云片子账户.jpg](http://upload-images.jianshu.io/upload_images/264714-e793aa3337256e10.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

点击APIKEY右边的眼睛icon，通过验证码就能查看到apikey，并记录下来给我们的代码使用。

#2.3. 新增签名

无论是螺丝帽还是云片，在发送短信时，都需要在短信内容中提供签名信息，比如下面这条短信：

> 【小黄书科技】尊敬的用户，您的验证码是：123456，请在10分钟内输入

前面的”【小黄书科技】“就是签名。我们必须要在申请，通过审核后才能使用。否则发送短信时就会报签名无效之类的错误。

我们可以导航到控制台左侧的国内短信>签名/模板报备中新增签名。
![云片签名申请.jpg](http://upload-images.jianshu.io/upload_images/264714-e242189fe970adde.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

新增的签名必须要等待审核，一般来说，如果是工作时间的话，30分钟内就会有结果。

我们这里申请到的签名就是:
> 【小黄书科技】

# 2.4. 新增模板

如前面提及的，云片中必须要申请模板，发送的短信消息必须符合模板中的内容才能正常发送出去。

所以我们这里要申请一个模板：

![云片模板申请.jpg](http://upload-images.jianshu.io/upload_images/264714-87bbfd0285927476.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

申请云片的验证码类模板的时候，如果你是想在你的网站上应用短信验证码功能的话，你需要提供你的网站地址，并且页面上有应用上图形验证码的功能，否则审核不会通过。据说这是为了防止短信通道轰炸。

如果你的网站还在开发中，还没有提供相应的图形验证码功能的话，可以在填写网址的同时写上“开发中”的注释，云片也会通过审核。但会在你的网站上线后重新审核。具体云片怎么知道是否上线的，我就不得而知了。估计是人肉吧。

我们这里申请到的模板就是:

> 【小黄书科技】尊敬的用户，您的验证码是：#code#，请在10分钟内输入

# 2.5. 云片发送短信消息接口

详细接口描述，请查看官网：
https://www.yunpian.com/api2.0/scene-smsverify.html

具体做法就是将组织好的包含目标手机号码和信息内容的的信息post到下面的地址来进行短信发送：
https://sms.yunpian.com/v2/sms/single_send.json

因为片云没有提供nodejs的示例代码，所以我们这里看下Python的一个调用例子:

``` python
# apikey:成功注册后登录云片官网,进入后台可查看
# text:需要使用已审核通过的模板或者默认模板
# mobile:接收的手机号,仅支持单号码发送
def send_sms(apikey, text, mobile):
#服务地址
sms_host = "sms.yunpian.com"
#端口号
port = 443
#版本号
version = "v2"
#智能匹配模板短信接口的URI
sms_send_uri = "/" + version + "/sms/single_send.json"
params = urllib.urlencode({'apikey': apikey, 'text': text, 'mobile':mobile})
headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
conn = httplib.HTTPSConnection(sms_host, port=port, timeout=30)
conn.request("POST", sms_send_uri, params, headers)
response = conn.getresponse()
response_str = response.read()
conn.close()
return response_str
```
从代码我们可以看到，整个发送流程就是
- 将apikey,text,和mobile做成querystring形式的参数
- 设置http头为‘application/x-www-form-urlencode’的格式，
- 将QueryString形式的参数POST到‘https://sms.yunpian.com/v2/sms/single_send.json’ 

也就是说，示例中是将数据放到uri参数中来进行POST的。

其实，采用POST的话，既可以在uri中带有queryString也可以将数据放在body中。body内容可以有多种编码形式，其中application/x-www-form-urlencoded编码其实是基于uri的percent-encoding编码的，所以采用application/x-www-form-urlencoded的POST数据和queryString只是形式不同，本质都是传递参数。

# 2.6. 实现云片发送验证消息

在nodejs的实现中，我们会用request的promise库request-promise来实现。

参考上面python的代码，我们可以考虑使用第二种POST方法，将数据放到body中来实行发送验证码的请求。

 这里我们就需要用到request的options里面的form选项:

>form - when passed an object or a querystring, this sets body to a querystring representation of value, and adds Content-type: application/x-www-form-urlencoded header. When passed no options, a FormData instance is returned (and is piped to request). See "Forms" section above.

意思就是该参数能将我们填写的对象(json)或者querystring格式数据转变成querystring格式的数据，并放到body中进行发送，并且会帮我们自动在http头中加入Content-type: application/x-www-form-urlencoded。

也就是说，如果我们request的options是这样的:

``` js
const options = {
      url: 'https://sms.yunpian.com/v2/sms/single_send.json',
      method: 'POST',
      form: {
        mobile:  18088821076
        text: '【小黄书科技】尊敬的用户，您的验证码是：20148，请在10分钟内输入 to 18088821076'
        'apikey': xxxxxxx, // 根据你自己情况填写
      },
      json: true,
    };
```
那么requst内部会将我们发送到目标地址的body变成类似以下的querystring的参数字符串格式。
``` html
body: 'mobile=18088821076&text=%E3%80%90%E5%B0%8F%E9%BB%84%E4%B9%A6%E7%A7%91%E6%8A%80%E3%80%91%E5%B0%8A%E6%95%AC%E7%9A%84%E7%94%A8%E6%88%B7%EF%BC%8C%E6%82%A8%E7%9A%84%E9%AA%8C%E8%AF%81%E7%A0%81%E6%98%AF%EF%BC%9A20148%EF%BC%8C%E8%AF%B7%E5%9C%A810%E5%88%86%E9%92%9F%E5%86%85%E8%BE%93%E5%85%A5&apikey=xxxxxxx',
```

同时http头会加上‘Content-type: application/x-www-form-urlencoded’：

``` html
header: 'POST /v2/sms/single_send.json HTTP/1.1\r\nhost: sms.yunpian.com\r\ncontent-type: application/x-www-form-urlencoded\r\naccept: application/json\r\ncontent-length: 323\r\n
```

以下是是具体的实现代码:

``` js
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
```

注意我这里没有做过多的错误处理，为了更好的了解错误原因，其实应该根据response的code进行不同的错误处理。

上面是通用的短信发送接口。我们为了统一发送满足在云片上注册的模版消息，需要提供一个高层级的sendCode方法来发送验证码消息:

``` js
async function sendCode(mobile, code) {
    try {
        const message = `【小黄书科技】尊敬的用户，您的验证码是：${code}，请在10分钟内输入`;
        return await send(mobile, message);
    } catch (e) {
        log.error('Exception:', e);
        throw e;
    }
}
```

这里的message一定要和我们在云片控制台上已经通过审核的模板消息一致，只允许code那部分有变动。

最后是将这两个方法exports出去给其他模块调用:

``` js
module.exports = {
  send,
  sendCode,
};

```

# 3. 螺丝帽
---

# 3.1. 注册
注册页面：
https://my.luosimao.com

# 3.2. 新增签名

注册后登陆螺丝帽的管理后台，导航到“短信>签名管理”页面进行签名申请：
https://sms-my.luosimao.com/signature

懒得贴图，相信这个难不到大家。

这里值得指出的是，我在螺丝帽中无法申请如上面云片中的“【小黄书科技】”的签名，因为里面带有“黄书”两个字。所以螺丝帽的示例中我会用【techgogogo】作为签名。

这里同时也提醒我们，在真实的产品研发中，好的产品名是如何的重要。

# 3.3. 新增模板

到页面“短信>短信模板“中进行模板消息的申请。
https://sms-my.luosimao.com/template/index

需要注意的是，短信模板在螺丝帽中不是必须的，没有模板，我们也照样能通过螺丝帽发送出验证短信。只是，据说有了模板后，发送的短信回不需要经过审核，所以速度回变快很多。

我这里申请到的模板是:
>"尊敬的用户，您的验证码是：###，请在10分钟内输入【techgogogo】"

# 3.4 螺丝帽发送短信消息接口

详细接口描述，请查看官网：
https://luosimao.com/docs/api/20

nodejs版本的示例如下：

``` js
var https = require('https');
var querystring = require('querystring');

var postData = {
    mobile:'13761428267',
    message:'验证码:28261【铁壳测试】'
};

var content = querystring.stringify(postData);

var options = {
    host:'sms-api.luosimao.com',
    path:'/v1/send.json',
    method:'POST',
    auth:'api:key-12312389d10fe16c98896ced5a09945188',
    agent:false,
    rejectUnauthorized : false,
    headers:{
    'Content-Type' : 'application/x-www-form-urlencoded',
    'Content-Length' :content.length
    }
};

var req = https.request(options,function(res){
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
    console.log(JSON.parse(chunk));
    });
    res.on('end',function(){
    console.log('over');
    });
});

    req.write(content);
    req.end();
```

可以看到，和上面的云片的发送方式会有以下异同：

- 示例中用的是https的库来进行POST请求
- apikey的格式不一样，key的值前面要带"key-"
- apikey不再放在body中，而是放在了auth的options选项中
- body中继续使用querystring的格式提供手机号和发送的信息内容数据
- header中指定的Content-Type一样是'application/x-www-form-urlencoded'

# 3.4. 实现云片发送验证消息

根据上面的示例，很明显，我们同样可以通过request-promise库来完成我们的工作。且，为了和云片一致，我们也应该使用request-promise库。

实现的send代码如下:

``` js
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
```

实现的sendCode代码如下:

``` js
async function sendCode(mobile, code) {
  try {
    const message = `尊敬的用户，您的验证码是：${code}，请在10分钟内输入【techgogogo】`;
    return await send(mobile, message);
  } catch (e) {
    log.error('Exception:', e);
    throw e;
  }
}
```

最后是将这两个方法exports出去给其他模块调用:

``` js
module.exports = {
  send,
  sendCode,
};

```

对比上面云片的代码，可以看到代码并没有多大的区别，除了request的options有点不一样，其他基本是一致的。

# 4. 开关控制螺丝帽和云片的切换
---
我们同时只会让一个短信供应商起效，我们可以选择云片，也可以选择螺丝帽。

我们在config/configuration.js中增加一个配置项:

``` json
  sms: {
    yunpian: false,
    luosimao: true,
  }
```
同一时间中我们应该只设置其中一个为true，如果都是false的话，我们会用云片，如果都是true的话，我们会启用第一个。

下面就是具体的实现代码(libs/sms.js):

``` js
/**
 * Created by KevinZhu on 17/05/2017.
 */
const config = require('../config/configuration');
const luosimao = require('./luosimao');
const yunpian = require('./yunpian');

if (config.sms.yunpian) {
    module.exports = yunpian;
} else if(config.sms.luosimao)  {
    module.exports = luosimao;
} else {
    module.exports = yunpian;  // by default
}
```

这样，其他模块只需要在configuration.js文件中配置好使用哪个短信供应商，然后require进libs/sms.js，就可以直接使用sendCode来发送验证码了。


# 5. 发送验证码逻辑
---

发送验证码的逻辑是：

- 生成一个随机整数作为验证码
- 将该验证码发送给指定的手机号码
- 将该验证码绑定一个过期时间，如果超过指定时间，该验证码不再有效

随机数我们可以通过Math来获得，发送验证码到指定手机号码我们在上面已经实现，验证码过期时间管理我们可以像我们的访问令牌一样通过redis来实现。

所以我们可以实现一个sms的路由中间件(routes/sms.js):

``` js
const express = require('express');
const log = require('../libs/logger');
const sms = require('../libs/sms');
const router = express.Router();
const redis = require('../libs/redisdb');

router.post('/code', async (req, res, next) => {
  try {
    const { mobile } = req.body;

    // 生成4位数字的随机数算法：Math.floor(Math.random() * (max - min + 1)) + min;
    var code = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
    
    await sms.sendCode(mobile, code);
    await redis.setAsync(mobile, code);
    await redis.expireAsync(mobile, 60 * 10);
    return res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;

```

客户端只需要Post一个body指定了手机号码的信息到我们的服务器，指定的手机号码就能收到我们的验证码模版短信。

# 6. 结语
---

详细实现请查看github中的代码。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH08
- npm install 
- **gulp dev**

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
