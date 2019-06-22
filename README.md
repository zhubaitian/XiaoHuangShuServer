# 第六章 文件上传服务器

上一篇文章我们实现了小黄书后台框架中的鉴权服务。今天我们会开始实现文件上传的服务，因为我们参考的小红书中有很多地方是需要上传图片的，比如商品的图片等。

# 1. Express Multer中间件
---
Express框架下进行文件上传的一个很好用的中间件就是Multer:
https://github.com/expressjs/multer

它提供的Readme有很好的例子指导我们如何使用该中间件来进行文件的上传。

之所以叫Multer，顾名思义，应该就是为了支持Multipart/Form的http请求，也就是文件上传的请求。

![Multipart.jpg](http://upload-images.jianshu.io/upload_images/264714-0dc1b5c7330e3403.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 1.1. 一个简单的例子

最简单的一个使用方法就是:

``` js
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/profile', upload.single('avatar'), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})
```

这里有几点需要说下的是:
- multer的构造函数接受一个json接口的参数，我们可以指定存储的位置，修改文件名的方法(multer默认会生成一个唯一的文件id来作为文件名来进行存储，但有时我们需要修改成其他名字)等。比如我们这里指定的存储位置就是项目根目录下的的uploads目录。

- 代码中的路由的写法和我们之前的路由写法有点不一样，这里是一个堆叠的路由：先用multer中间件进行文件上传的处理，处理好后再传给我们自己编写的路由中间件。

- upload.single('avatar')，代表只接受上传一个文件，且指定的文件名是'avatar'。
![Tag.jpg](http://upload-images.jianshu.io/upload_images/264714-ea2fdbf4ac8b526f.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
- 中间件执行完后，会在req.file中加入上传后的文件的文件名，文件大小，文件类型，和文件存储路径等信息:
``` json
{ 
      fieldname: 'avatar',
      originalname: '跑车.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: '/Users/apple/Develop/wechatapp/XiaoHuangShuServer/server/routes/uploads/',
      filename: '1c61d2999a0f3d94c1461badbf22522e',
      path: '/Users/apple/Develop/wechatapp/XiaoHuangShuServer/server/routes/uploads/1c61d2999a0f3d94c1461badbf22522e',
      size: 348524
 }
```
- req.body中会存储传过来的body中的其他键值信息，比如我们定义一个标签Tag。
``` json
{ tag: 'public' }
```

因为我们这里上传的是图片，所以我们简单修改下，在routes/file.js上实现以下代码:

``` js
var express = require('express')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var app = express()

app.post('/upload', upload.single('image'), function (req, res, next) {
  res.send('Upload completed');
})
```

## 1.2. 修改文件名

Multer允许我们在初始化multer时，传入storage参数来更好的控制我们的文件存储方式，比如修改文件名等。

这里我们希望将文件名修改为由uuid作为文件名，且保留图片的后缀，然后存储到项目根目录的uploads上面。所以我们的multer的初始化可以做以下修改:

``` js
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const fileFormat = (file.originalname).split(".");
    const random = uuid.v4();
    cb(null, random  + "." + fileFormat[fileFormat.length - 1]);
  },

});

const upload = multer({
  storage: storage,
});
```
其中回调函数中传进来的file对象会包含解析前的基本信息：
``` js
{ 
      fieldname: 'image',
      originalname: '跑车.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg'
 }
```
经过multer中间件后，req.file的内容将会变成下面这样:
``` json
{ 
      fieldname: 'image',
      originalname: '跑车.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      destination: 'uploads/',
      filename: '3e1e9cc8-ab8f-44c9-b874-8ed53368875e.jpg',
      path: 'uploads/3e1e9cc8-ab8f-44c9-b874-8ed53368875e.jpg',
      size: 348524 
}
```

## 1.3. 过滤文件类型

我们这里只接受图片类型文件的上传，查看multer的README，我们知道在初始化multer时除了storage还有一个fileFilter，可以用来满足我们这个需求。

``` js
function fileFilter (req, file, cb) {

  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  cb(new Error('I don\'t have a clue!'))

}
```
如代码注释所言，主要是通过cb中的第二个参数来做控制，如果是我们可以接受的图片文件内容，就设置成true，否则设置成false。设置成false的话，req.file就会变成undefined，我们就可以在我们自己写得路由中间件中做处理。

multer初始化代码修改如下:

``` js
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
```
路由中间件代码修改如下:

``` js
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).send('Missing file content');
      return;
    }

    res.send('Upload completed');

  } catch (e) {
    next(e);
  }
});
```

如果客户端上传的不是图片文件，就返回个400 Bad Request给客户端。

## 1.4 限制上传文件大小

同时为了网络传输和客户端展示效率，我们应该限制上传的文件大小。查看multer的文档，我们在初始化multer时可以用limits参数来进行限制，默认使用的单位时比特。

limits参数有以下的选项，我们这里只限制文件大小。

| Key | Description | Default
|--------|:-----------:|---------:|
| fileSize |For multipart forms, the max file size (in bytes)	| Infinity |
| fieldNameSize|Max field name size	|100 bytes
| fieldSize|Max field value size	|1MB
| fields|Max number of non-file fields	| Infinity
| files|For multipart forms, the max number of file fields	| Infinity
| parts|For multipart forms, the max number of parts (fields + files)	| Infinity
| headerPairs|For multipart forms, the max number of header key=>value pairs to parse	| 2000

以下是实现代码，限制最大3MB的文件大小。如果超过限制，multer中间件会抛出File Too Large异常。

``` js
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {fileSize: 3 * 1024 * 1024}, // 3MB file size limits
});
```

# 2. 保存图片文件信息
---

图片上传到服务器之后，我们需要记录下文件的一些关键信息，比如访问路径等。这样的话我们就可以通过查询数据库知道某个商品相关的图片的具体信息。

我们到时的商品数据库的collections中很有可能就有一个field是专门用来存储文件id的，然后可以根据这个文件id来查询图片的collections来获得该文件的具体信息。

## 2.1. 增加图片信息记录

所以，我们这里先定义好我们的图片文件的模型。在models下建立Images.js文件，仿效之前的User.js，实现代码如下:

``` js
'use strict';

const Schema = require('mongoose').Schema;

const db = require('../libs/mongodb');

const ImageSchema = new Schema({
  original: { type: String, required: true },      // 原始文件名
  filename: { type: String, required: true },      // 目标文件名
  url: String,                                     // 访问 URL 地址
  mime_type: String,                               // 文件类型
  size: Number,                                    // 文件大小
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

ImageSchema.options.toJSON = {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
};


module.exports = db.model('Image', ImageSchema);

```

然后，我们需要在文件上传的路由中实现Image存储的业务逻辑，完整代码如下:

``` js
router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).send('Missing file content');
            return;
        }

        let image = {};
        let filename = '';

        filename = `${req.file.filename}`;
        image = {
            filename,
            original: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype,
            url: 'http://localhost:3000/v1/uploads/' + filename,
        };

        const imageFile = new Image(image);
        await imageFile.save();

        res.send(imageFile);

    } catch (e) {
        next(e);
    }
});
```

每上传一个图片，我们都会在Image这个collections上增加一条记录。

## 2.2. 删除图片和数据库记录

既然允许用户增加文件，当然也应该允许用户删除文件。比如删除一个商品信息时，应该要把相关的文件也删除掉。

以下就是具体实现:

``` js
router.delete('/:id', async (req, res, next) => {
  try {
    const query = {};

    query._id = req.params.id;

    const file = await Image.findOne(query);
    if (!file) {
      throw new ClientError.NotFoundError();
    }

    fs.unlink(`uploads/${file.filename}`, (fserr) => {
      if (fserr) {
        log.error('Failed to remove upload tmp file', `uploads/${file.filename}`);
        res.status(500).send('Failed to del file');
        return;
      }
    });

    await file.remove();
    res.status(204).end();

  } catch (e) {
    next(e);
  }
});
```

先是从磁盘中将文件删除掉，然后从数据库中将对应的文件记录给清掉。

最后，我们不需要将uploads文件夹下的图片上传到github，所以在.gitignore中加入下面这行:
``` js
uploads/
```

# 3. 访问文件
---
文件上传后，我们可以在浏览器中输入:http://localhost:3000/v1/uploads/文件名 来进行图片访问。

但是，访问之前，我们有几个地方需要改一下：

- 需要在server.js后面加上这一行:

``` js
app.use('/v1/uploads', express.static('uploads/'));
```

express.static是express的内置中间件，专门用来提供静态文件资源服务的。所有"/v1/uploads"开始的资源请求，都会在uploads文件夹下提供。

-  然后在鉴权中间件中开放对“/v1/uploads”开始的路由的访问，我们访问服务器上的图片是不需要提供访问令牌的:

``` js
...
      // APIS need no authentication
      if (req.path === '/'
          || req.path === '/v1/auth/login'
          || req.path.startsWith('/v1/uploads')) {

        log.debug('no auth required');
        next();

        return;
      }
...
```

这时从浏览器访问还是会因为我们没有提供favicon.ico而失败，我们这里不做这个文件的提供，直接在鉴权中间件中对此请求飘过：

``` js
      if (req.path === '/favicon.ico') {
        res.status(404).end();
        return;
      }
```
# 4. 结语
---

重构后和完整的代码请从github中获取。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH06
- npm install 
- **gulp dev**


---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
