# 第七章 文件上传到CDN

上一篇文章我们通过multer这个中间件将图片顺利的上传到了我们的服务器上面，且将图片的元数据存储到了Image这个mongodb的collections里面。

这一章我们看下应该如何将文件上传到cdn，以便客户端通过cdn来快速访问图片。

这里我们用到的cdn是又拍云的，国内知名度比较高，且注册认证后会送1个月的免费券。

我们要达成的目标是:

- 在配置文件提供一个开关，打开的话会将图片传送到服务器之后再上传到cdn

- 如果开关关闭，则只是上传到服务器

- 将文件上传到cdn

- 删除文件时同时把cdn上的文件也删除掉

# 1. 又拍云
---
又拍云的使用强烈建议去看官方文档，这里只做简单的描述。

# 1.1. 注册账号

我们可以到又拍云中注册一个账号：
https://www.upyun.com/

注册完之后进行实名认证，然后可以得到一张有一个月使用权限的代金券，这足够我们去体验又拍云的cdn的功能了。

# 1.2. 创建又拍云cdn服务

登录后进入服务页面，点击右上角的创建服务。

![又拍云服务.jpeg](http://upload-images.jianshu.io/upload_images/264714-98662ec10ef362d4.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在弹出框中选择创建”全网加速服务“。

![又拍云全网加速服务.jpeg](http://upload-images.jianshu.io/upload_images/264714-c609167a4745399a.jpeg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

注意：
- 服务名称要唯一。对应我们下面通过又拍云的node-sdk连接又拍云时需要用到的‘bucket’

- 源站类型选择‘又拍云’，自主源和又拍云选项的区别是:
  - 自主源站：表示资源都存放在客户自己的源站或第三方云存储服务上，仅使用又拍云 CDN 服务
  - upyun存储：表示资源都存放在又拍云分布式对象存储服务上，同时附加了 CDN 的支持，因此也拥有绝大多数又拍云 CDN 的功能

- 服务授权（操作员）： 设定／建立操作员，我们在又拍云的node-sdk连接又拍云时需要用到。这里我创建了一个叫做techgogogo的用户。

服务建立好后可以在服务页面中看到：

![小黄书服务.jpg](http://upload-images.jianshu.io/upload_images/264714-4170ce1e0fce30e0.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

其中的加速域名就是我们上传图片到cdn后，访问图片所需要指定的域名。

# 2. 上传图片到又拍云

又拍云根据不同的开发语言提供了不同的访问sdk，我们这里用的是nodejs版本的：
https://github.com/upyun/node-sdk

## 2.1 接入又拍云

根据官方阐述，通过又拍云的node-sdk，我们可以通过以下方式接入又拍云：
``` js
var upyun = new UpYun(bucket, operator, password [, endpoint], [, options]);
```

其中参数意义如下:
- **bucket**: 你要使用的 upyun 空间名字。这里就是我们上面增加的‘xiaohuangshu’这个服务。
- **operator**: 拥有 bucket 授权的操作员。这里就是我们上面添加的techgogogo这个操作员
- **password**: 拥有 bucket 授权的操作员的密码。techgogogo操作员的密码
- **endpoint**: API 接入点，可以刷是如下值(我们选择第一种):
  - v0.api.upyun.com : 自动选择合适的线路
  - v1.api.upyun.com : 电信线路
  - v2.api.upyun.com : 联通（网通）线路
  - v3.api.upyun.com : 移动（铁通）线路
- **options**: 使用选项，可以指定以下选项
  - options.apiVersion 如果不指定，则使用旧版 API，新版 API 可以指定为 v2。我们这里用的就是v2
  - options.secret 如果指定，则可以使用 form 上传。 我们这里通过restful api来上传，所以留空。

>注：旧版 API 已不再更新，请指定 options.apiVersion 为 v2 使用新版 API。

因为这里有阿里云个人隐私性的信息，不应该上传到github上。所以我会在config目录下创建一个叫做confidential.js的文件，然后写入如下内容:
``` js
module.exports = {
  upload: {
    protocol: 'http://',                  // 小黄书又拍云访问协议
    host: 'xiaohuangshu.b0.upaiyun.com',  // 小黄书服务访问地址
    endpoint: 'v0.api.upyun.com',         // 接入点
    bucket: 'xiaohuangshu',                  // 服务名称
    operator: 'techgogogo',                  // 小黄书操作员用户名
    password: 'xxxx',              // 小黄书操作员密码。请根据您自己的情况填写
    api_version: 'v2',                    // api版本号
  },
};
```

然后在.gitignore中加入以下一行来让git push时不要上传confidential.js文件:

``` js
server/config/confidential.js
```

这样，我们就可以在处理文件上传的file.js文件中接入又拍云了：

``` js
const confidential = require('../config/confidential');
const UPYUN = require('upyun');
const upyun = new UPYUN(confidential.upload.bucket, 
    confidential.upload.operator, 
    confidential.upload.password, 
    confidential.upload.endpoint, 
    {apiVersion:confidential.upload.api_version});

```

## 2.2. 上传文件到又拍云

上传文件到又拍云的api：
``` js
putFile(remotePath, localFile, type, checksum, opts, callback)
```
其中参数释义如下:
- **remotePath**: 文件存放路径
- **localFile**: 欲上传的文件，文件的本地路径 或者文件对应的 buffer
- **type**: 指定文件的 Content-Type, 如果传 null, 这时服务器会自动判断文件类型
- **checksum**: 为 true时 SDK 会计算文件的 md5 值并将其传于 API 校验
- **opts**: 其他请求头部参数（以 JS 对象格式传入，常用于图片处理等需求）

如文章开头所说，我们需要控制文件是否需要上传到cdn，所以我们在config/configuration.js增加配置如下:

``` js
  upload: {
    to_upyun: true, // 是否上传到又拍云
  }
```

然后在上传图片的路由中实现又拍云上传图片的逻辑:

``` js
filename = `${req.file.filename}`;
 if (config.upload.to_upyun) {
            upyun.putFile(filename, req.file.path, req.file.mimetype, true, {}, async(err, result) => {
                if (err) {
                    log.error('Upyun error', err, err.stack);
                    res.status(500).send('Failed to sync to cdn server');
                    return;
                }
                if (result.statusCode !== 200) {
                    log.error('Upyun error', result);
                    res.status(500).send('Upyun response with error');
                    return;
                }

               ...
            })
        }
```

其中putFile的参数对比上面的参数释义则一目了然，无需我做过多解析。

## 2.3. 从又拍云移除文件

和在上传图片到服务器后，根据配置开关决定是否上传到又拍云一样，我们在删除图片时，也要根据开关判断我们是否需要删除又拍云上对应的图片。

又拍云删除一个文件的api如下:

``` js
 deleteFile(remotePath, callback)
```
其中参数释义如下:

- **remotePath**: 文件在 upyun 空间的路径。 和上面的putFile的的第一个参数removePath一致。

我们在删除图片的路由中实现这个逻辑:

``` js
      if (config.upload.to_upyun) {
          upyun.deleteFile(file.filename, async(err, result) => {
              if (err) {
                  log.error('Upyun error', err, err.stack);
                  res.status(500).send('Failed to del cdn server');
                  return;
              }
              if (result.statusCode !== 200) {
                  log.error('Upyun error', result);
                  res.status(500).send('Upyun response with error');
                  return;
              }
              ...
          });
      }
```

# 3. 结语
---

详细实现请查看github中的代码。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH07
- npm install 
- **gulp dev**

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
