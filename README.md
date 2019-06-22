# 第二章 路由级中间件及SRP单一职责原则

# 1. SRP单一职责原则

单一职责原则（SRP：Single responsibility principle）又称单一功能原则。指的是不要存在多于一个导致类变更的原因。通俗的说,即一个类只负责一项职责。在nodejs中，我们这里将‘类’转变成‘模块’，单一职责原则同样适用。

首先，回顾我们上一章的helloworld这个api在server.js文件中的应用级中间件的实现:

``` js
app.use('/v1/helloworld', (req,res,next) => {
    try {
        const {subject} = req.body;
        res.send(`Hello ${subject}`);
    } catch (e) {
        next(e);
    }
})
```

## 1.1 代码的可扩展性和单一职责原则
通过上一章我们知道，app.use会导致uri为‘/v1/helloworld'的所有请求都落入到这个中间件来进行处理，所以我们这里很有必要将其分开。比如我们需要实现针对uri为'/v1/helloworld'的GET请求和POST请求，分别实现不同的业务逻辑， 那么代码大概会是如下:

```js
app.post('/v1/helloworld', (req,res,next) => {
    try {
        const {subject} = req.body;
        res.send(`Hello ${subject}`);
    } catch (e) {
        next(e);
    }
});

app.get('/v1/helloworld', (req,res,next) => {
    try {
        res.send(`Here is the helloworld!`);
    } catch (e) {
        next(e);
    }
})
```
随着时间的进展，我们的api将会越来越丰富。如果我们一直是使用应用层级的中间件在server.js文件上进行实现的话，那么server.jsj会变得越来越臃肿，我们的代码的可维护性和扩展性就会变得很烂。

同时，这也违反了设计模式中六大设计原则中的单一职责原则：我们的server.js肩负了太多的职责，我们应该把负责处理不同路由请求的中间件给独立出去！

## 1.2 应用级中间件结合路由级中间件实现模块化

这时Express的路由中间件就需要出场了。其实路由级中间件和应用级中间件一样，只是它绑定的对象为 express.Router(),而不是应用层级的app。但是路由中间件很重的一个功能就是帮助我们创建可维护性强的模块化的请求处理代码。

比如，我们将我们最开始的helloworld请求处理中间件首先修改成:

```js
const router = express.Router();
router.use('/', async (req, res, next) => {
    try {
        const { subject } = req.body;
        res.send(`Hello ${subject}`);
    } catch (e) {
        next(e);
    }
});

app.use('/v1/helloworld',router);
```
那么，我们只需要将最后一行代码以外的所有代码拷贝到一个新的文件，比如routes/hello_world.js中，然后将整个router给export出来:
``` js
const express = require('express');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { subject } = req.body;
    res.send(`Hello ${subject}`);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
```
然后在server.js中将该router给require进来:
```js
app.use('/v1/helloworld',require(`${__dirname}/routes/hello_world`));
```
那么我们的server.js就会变得非常的简洁:
``` js
const express = require('express');
const app = express();

const bodyParser = require('body-parser')
const bodyParserXML = require('body-parser-xml');

// Middlewares to parse different format of request data to body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
bodyParserXML(bodyParser);
app.use(bodyParser.xml());

app.use('/v1/helloworld',require(`${__dirname}/routes/hello_world`));

// Start express server and listen to the PORT specified below
const PORT = 3000
app.listen(PORT, function() {
  console.log('Express server running at localhost:' + PORT)
})
```
今后需要扩展helloworld的不同的请求的时候，只需要在routes/hello_world.js中进行修改就行了。因为按照我们此前的分析，我们这里在server.js用的是app.use这个应用级中间件，所有uri是'/v1/helloworld'的请求，无论是POST还是GET还是其他，都会落入到routes/hello_world.js所实现的路由中间件来进行执行。

## 1.3 扩展helloworld路由请求
比如我们上面提起的GET和POST的helloworld请求，可以在routes/hello_world.js中修改成:

``` js
const express = require('express');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { subject } = req.body;
    res.send(`Hello ${subject}`);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { subject } = req.body;
    res.send(`Here is the helloworld!`);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

```
而server.js不需要做任何改变。所以说这里我们是通过应用级中间件和路由级中间件实现了代码的模块化:

- server.js中使用app.use来接纳所有来自'/v1/helloworld'的请求，并丢给routes/hello_world.js所实现的router来进行处理

- routes/hello_world.js中，通过router.METHOD的路由级中间件来实现不同METHOD(GET,POST,DELETE等)的请求处理。

我们可以通过上一章介绍的Insomnia工具对这两个API请求进行测试，我这里就不贴图了，大家自己动手吧。

# 2. 一劳永逸的应用级中间件实现
---
通过以上的方法，我们虽然可以不用动server.js就能自由的对helloworld的请求进行扩展，但是，如果我们增加了其他的请求，比如login请求，那么我们还是需要对server.js进行修改，将login的应用级中间件给加上去。

那么我们有没有一劳永逸的办法，让我们在routes目录下新增一个路由级中间件文件时，不需要动任何server.js的代码呢？

办法当然是有的，说穿了也很简单。就是在server.js中通过遍历routes文件夹下面的文件，将每个文件的文件名作为应用级路由的挂载点，且require上对应的路由级中间件文件就可以了:

``` js
const fs = require('fs');
fs.readdir(`${__dirname}/routes/`, (err,files) => {
    for(const file of files) {
        const path = '/v1/' + file.split(".")[0];
        console.log('Attaching router:',path);
        app.use(path,require(`${__dirname}/routes/${file}`))
    }
})
```

这样修改之后，我们今后无论要在routes中加任何的路由级中间件的实现文件，server.js都不需要做任何修改了。

但是有一点需要注意的是，客户端请求的url中的uri名称必须和routes下面的文件名相对应。比如针对"routes/hello_world.js"文件所实现的路由中间件router.post，我们请求的url就要从之前的:
"http://localhost:3000/v1/helloworld" 
换成
 "http://localhost:3000/va/hello_world" 。

# 3. 结语
---
最新的代码请可以从github中获取。
-  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH02
- npm install 
- node server/server.js

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
