# 第一章 [小黄书后台]Insomnia及HelloWorld

我们今天开始迈出小黄书项目实战的第一步。前几篇文章就主要围绕Nodejs+Express的架构的构建。当我们架构建好之后，到时我们只需要在需要的位置填写代码就好了，开发起来就能非常快速。

本篇文章作为这一系列的开篇之作，主要会给大家阐述这几点:

- 如何通过Restful Client工具来调试小黄书服务器

- 实现一个简单的Express版本HelloWorld，并对一些容易忽略的知识点进行拾遗补缺

本章过后，我们将一起不断的对这个HelloWorld进行扩展，最后做成能满足我们小黄书这个产品的需求的强大后台。请大家拭目以待。

# 1. Insomnia
---
工欲善其事必先利其器。开发调试Resftful API的服务，我们需要有些好的工具进行支持。当然，如果你是命令行控的话，通过curl等工具来完成应该是挺具极客精神的。

## 1.1 Postman vs Insomnia
[Postman示例]
![Postman](http://img.blog.csdn.net/20170510100807604?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

[Insomnia示例]
![Insomnia](http://img.blog.csdn.net/20170510100422211?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

对于调试Restful API的工具，最出名的应该就是谷歌的Postman工具。但是这个工具是个内存和CPU消耗大户(至少在我的Mackbook pro乞丐版上是如此，很容易就耗掉我1G多的内存和冲爆我的CPU)。

所以后来我不得不换了另外一个叫做[Insomnia](https://insomnia.rest/)的工具，我在postman用到的功能，在Insomnia上基本都有。唯一缺失的就是:

- 不能将请求返回的数据自动提取出来保存到环境变量之中

也就是说，比如，登录后获取的访问令牌，我们必须手动将其设置到环境变量中，然后访问其他需要提供令牌才能调用的api就能直接从环境变量中获取到该令牌，并设置到请求头的Authorization字段来进行api的访问。而在postman工具中，我们是可以通过几行脚本轻松让其自动实现这一点的。

从Insomnia的[官方文档](https://insomnia.rest/documentation/faq/)中我们得知，这个功能往后的版本应该很快就会提供，这对我们来说也是个好消息.

>**Technical Questions**
How can I set an environment variable from a request?
*At this time, that is not possible, but it’s coming soon.*

## 1.2 Insomnia下载和文档

请访问Insominia官网获取相关信息，这里不做赘述。

- 下载：https://insomnia.rest

- 官方文档：https://insomnia.rest/documentation/




## 1.3 Insomnia环境配置

首先打开Insomnia应用，定位到如图的环境配置管理。
![这里写图片描述](http://img.blog.csdn.net/20170510102940789?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

打开后会进入环境配置页面，这里我们可以看到左边有Base Environment和Sub Environment， 其实这个概念类似于面向对象中的继承。我们可能会有本地开发调试用的localhost子环境，部署到staging后的staging服务器子环境，部署到production后的production子环境，我们可以在Base Environment中配置我们各个子环境共用的一些环境变量。比如，我们今后可能会在请求Restful API时携带同一个locale设置。那么，我们可以设置如下:
![这里写图片描述](http://img.blog.csdn.net/20170510103931677?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

跟着我们开始进行我们的本地开发调试子环境的配置。点击左边的Sub Environments后面的+号新建一个叫做localhost的子环境，环境变量配置如下:
![这里写图片描述](http://img.blog.csdn.net/20170510104417512?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

这里各个自定义的环境变量的意义如下:

- api_host: 指定我们的api请求应该发送到的目的地，这里就是我们的本地小黄书开发服务器。

- base_path: 考虑到我们API的扩展性，所以我们应该对api进行版本控制。比如多年之后，我们的一些用户可能还用着老的客户端，使用者老的登录API来进行登录:http://localhost:3000/v1/auth/login。而在最新的客户端中，我们已经升级了登录API，使用了第二版的登录API：http://localhost:3000/v2/auth/login。

- token： 这里是用来存储我们的访问令牌。我们有些api必须要有admin的权限才能访问，所以在访问该api时必须带上拥有该权限的令牌

- schemes: http协议的版本。本地调试时我们一般用的是http版本，但部署到produciton上时，我们有可能会搭建起https来进行更安全的访问。

## 1.4 Insomnia 使用
点击如图+按钮创建一个叫做‘小黄书‘的顶层目录。
![这里写图片描述](http://img.blog.csdn.net/20170510120827368?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

我们的api请求可以在这个目录下面进行组织。

这里我们可以尝试下创建一个叫做helloworld的Post请求，当然，这个api现在还不能调用，因为我们的helloworl还没有写出来。该请求的格式应该是这样的:
![这里写图片描述](http://img.blog.csdn.net/20170510121524870?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)
这个请求会发送一个JSON格式的数据到服务器的helloworld接口，所以我们需要在请求Header中指定我们的Content-Type:
![这里写图片描述](http://img.blog.csdn.net/20170510121704574?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

同时，我们现在用的url都是hardcode的，如果我们不在localhost这个子环境中调试的话，我们就需要整串url进行修改。所以我们这里需要应用上前面描述的Insomnia的环境变量。那么我们怎么引用环境变量呢？其实很简单，将对应的变量名通过两个大括号{{}}引用起来就行了。

比如，我们上面的URL替换成环境变量之后将会是：
> {{schemes}}://{{api_host}}{{base_path}}/helloworld

Insomnia上的呈现将成为这样:
![这里写图片描述](http://img.blog.csdn.net/20170510122237921?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

等我们往下将Helloworld这个API实现了，我们就可以点击右边的Send按钮来发送请求并查看返回了。

# 2. Nodejs环境
因为过程中会用到很多ES6的特性，所以我这里用的Nodejs版本是比较新的:v7.9.0:
> appledeMacBook-Pro:XiaoHuangShuServer apple$ node --version
v7.9.0

该版本的Nodejs支持大部分的ES6特性。

同时，这里建议大家安装nvm这个工具来进行nodejs的版本管理，非常的方便。

> 
appledeMacBook-Pro:XiaoHuangShuServer apple$ nvm --help

>Node Version Manager

>Note: <version> refers to any version-like string nvm understands. This includes:
  - full or partial version numbers, starting with an optional "v" (0.10, v0.1.2, v1)
  - default (built-in) aliases: node, stable, unstable, iojs, system
  - custom aliases you define with `nvm alias foo`
...

往上已经有很多nodejs和nvm该如何安装的教程和博客，这不是我们的重点，这里我就不想花时间在这上面了。大家自行搜索吧。

同时，对于ES6相关的知识，建议大家查看阮一峰的《ES6 标准入门》。如果不清楚也没有关系，我也是需要的时候就去查阅下而已。
![这里写图片描述](http://img.blog.csdn.net/20170510124647091?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

# 3. HelloWorld
---
这里我会先把Helloworld代码献上，然后针对性的对相应的知识点进行下脑补。

## 3.1 代码


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

// Middleware to handle helloworld request
app.use('/v1/helloworld', (req,res,next) => {
    try {
        const {subject} = req.body;
        res.send(`Hello ${subject}`);
    } catch (e) {
        next(e);
    }
})

// Start express server and listen to the PORT specified below
var PORT = 3000
app.listen(PORT, function() {
  console.log('Express server running at localhost:' + PORT)
})

```

整段代码应该算是比较简单的Express版本Helloworld代码了:

- 首先引入express模块。该模块需要通过npm来进行安装

- 然后实例化express

- 跟着通过引入几个第三方中间件来对客户端通过不同方式传进来的数据进行解析。值得注意的是这些中间件会将解析好的数据放到req.body上面。***Express会在一个请求的生命周期中维护对应这个请求的req和res对象，并在调用一个中间件提供的回调函数时提供这个两个对象作为参数***。比如往下的helloworld中间件中的回调。

- 接着创建一个挂载点为(/v1/helloworld)的中间件。也就是说，当我们访问:http://localhost:3000/v1/helloworld 的时候，express就会执行后面的那个回调函数，取出传进来的subject变量，然后通过res.send返回一串组合的字串给客户端。

- 最后就是启动express服务器的监听。

## 3.2 require的缓存和单例以及首次执行特性
之前用nodejs写代码的时候一直有用require来引入其他模块。但当时对此没有足够的理解，将其当成Java的import和c++的include来简单对待完事。

记得当时实现一个处理微信api的对象的时候，因为该对象需要在构造函数中保持一个跟微信服务器的连接，所以自己还特意画蛇添足的将其实现成为单例的模式。

事实上nodejs的require有以下两个特点：

- 导入的模块有缓存特性。也就是说，当你第一次require一个模块的时候，nodejs内部机制会将该实例对象缓存起来。当你往后再require同一个模块的时候，将会把前面的那个实例返回来。

- 正因为上面的缓存特性，所以导入的模块就有了单例特性。

- 同时在第一次require一个模块的时候，如果该模块里面有执行代码，该代码会立刻执行。但因为单例的特性，在第二次以后require该模块的时候，这些代码将不会执行。

比如，如果要实现一个处理mongodb的连接连接的模块。

``` js
const mmongo = require('mongoose');

console.log('Initialize MongoDB ...');
const db='mongodb://127.0.0.1:27017/xiaohuangshu';
mmongo.connect(db);
module.exports = mmongo;

```

那么我们在其他的地方第一次require这个模块的时候，该模块的代码都会执行，且会缓存并返回一个mongoose的实例。

但在第二次以后再去require这个模块的时候，我们将不会看到有任何打印信息出来。也就是说里面的代码不会再执行一遍，只会返回第一次require时缓存起来的实例回来。

## 3.3 Express中间件

>中间件（Middleware） 是一个函数，它可以访问请求对象（request object (req)）, 响应对象（response object (res)）, 和 web 应用中处于请求-响应循环流程中的中间件，一般被命名为 next 的变量。

>中间件的功能包括：

>- 执行任何代码。
- 修改请求和响应对象。
- 终结请求-响应循环。
- 调用堆栈中的下一个中间件。

>如果当前中间件没有终结请求-响应循环，则必须调用 next() 方法将控制权交给下一个中间件，否则请求就会挂起。

Express中间件分为以下几种:

- **应用级中间件**: 应用级中间件绑定到 app 对象 使用 app.use() 和 app.get等进行调用。比如我们这里处理'/v1/helloworld'请求的中间件。

- **路由级中间件**：路由级中间件和应用级中间件一样，只是它绑定的对象为 express.Router()。有了express Router，我们将更容易针对不同的请求实现模块编程。我计划在下一篇文章中对此进行描述。

- **错误处理中间件**: 错误处理中间件和其他中间件定义类似，只是要使用 4 个参数，而不是 3 个，其签名如下： (err, req, res, next)。一般来会在其他中间件调用完后，最后定义错误处理中间件。***如果向 next() 传入参数（除了 ‘route’ 字符串），Express 会认为当前请求有错误的输出，因此跳过后续其他非错误处理和路由/中间件函数。***

- **内置中间件**：express.static 是 Express 唯一内置的中间件。它基于 serve-static，负责在 Express 应用中提托管静态资源。比如可以在helloworld中间件后面加一行“app.get('*',express.static('public'));”, 那么所有浏览器访问的静态资源(get请求。比如访问"http:lcalhoost:3000/index.html")都会默认从public文件夹下面进行提供。

- **第三方中间件**：需要额外安装的第三方中间件。比如我们这里的body-parser中间件。

更多中间件的阐述和示例，强烈建议查看官方文档，写得非常简单易懂：
http://www.expressjs.com.cn/guide/using-middleware.html#middleware.router

关于中间件，最后补充几点:

- 如果app.use(path,callback)指定的中间件中没有指定挂载点，那么所有的请求都将会进入该中间件进行处理。比如这里的body-parser等第三方中间件的处理。

- app.use(path,callback)和app.get(path,callback)的区别: 一是，前者代表所有满足该path的请求都会进入到该中间件进行处理，而后者代表只有是GET的http请求且满足该path才会进入到该中间件进行处理；二是，前者的callback可以是router对象又可以是函数，而后者只能是函数。

## 3.4 运行

Helloworld代码准备好之后，我们就可以通过node ./server.js来将其运行起来了。

执行时可能会提示你有哪些包没有安装，你就根据提示将其通过npm命令装上就好了。安装时后面加个--save参数，将其保存到package.json里面：

``` sh
appledeMacBook-Pro:XiaoHuangShuServer apple$ npm install express --save
XiaoHuangShu@1.0.0 /Users/apple/Tools/ngrok.2bdata.com/XiaoHuangShuServer
└── express@4.15.2 

npm WARN XiaoHuangShu@1.0.0 No repository field.
```
最后执行:
``` sh
appledeMacBook-Pro:XiaoHuangShuServer apple$ node server/server.js 
Express server running at localhost:3000
```

## 3.5 调试

这时我们就可以通过上面设置好的Insomnia的helloworld请求来测试该API时候有问题了。

![这里写图片描述](http://img.blog.csdn.net/20170510163420416?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvemh1YmFpdGlhbg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

通过点击发送Send按钮，很快我们就能看到右边的返回结果。我们可以修改下发送内容中的subject的值来测试不同的返回结果。

# 4. 结语
---
很感谢你能有耐心看到这里。其中有哪些值得提出来和改善的，真诚的（我是认真的）希望你能指点下。

代码我已经放到github上面，今后每次更新都会开一个新的branch来进行存储，方便大家浏览和追索。

获取代码并运行的命令步骤如下:
> -  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
> - cd XiaoHuangShuServer/
> - git checkout CH01-Initial-Setup
> - npm install 
> - node server/server.js

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
