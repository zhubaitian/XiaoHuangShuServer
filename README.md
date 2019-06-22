# 第三章 更高效的nodejs调试

上一篇文章我们通过引入Express Router来将来自客户端的各种请求代码模块化到routes目录下面，将server.js的代码保持足够的简洁。

我们前面在修改了代码之后，都需要重新执行'node server/server.js'来运行服务器代码来进行调试，这显得很麻烦。且我们调试也基本上通过console.log来做，效率很低，效果也不是很好。所以本章我们尝试解决这几个问题:

- 通过gulp和nodemon监控代码改动并自动重启服务

- 通过node-inspector和chrome进行代码调试

- 更好的调试打印工具

# 1. 代码改动监控
---
这里我们需要用到构建工具gulp，以及gulp的插件gulp-nodemon, 两者我们都可以通过npm进行安装。

## 1.2 gulpfile.js代码实现
首先我们在项目的根目录上生成gulpfile.js文件，该文件是gulp的默认配置文件。

然后编写代码如下:

``` js
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

gulp.task('nodemon', function () {
     return nodemon({
        verbose: false,
        exec: 'node',
        script: 'server/server.js',
        watch: ['server'],
        delay: 2000,
    })
});

gulp.task('dev',['nodemon'], function () {
    console.log('dev started....');
});
```
其中'nodemon'这个task是‘dev'这个task的一个前置依赖，我们通过gulp运行dev这个task的时候，会自动先运行’nodemon'。

> appledeMBP:XiaoHuangShuServer apple$ gulp dev
[17:39:11] Using gulpfile ~/Develop/wechatapp/XiaoHuangShuServer/gulpfile.js
[17:39:11] Starting 'nodemon'...
[17:39:11] Finished 'nodemon' after 240 ms
[17:39:11] Starting 'dev'...
dev started....
[17:39:11] Finished 'dev' after 209 μs
[17:39:11] [nodemon] 1.11.0
[17:39:11] [nodemon] to restart at any time, enter `rs`
[17:39:11] [nodemon] watching: /Users/apple/Develop/wechatapp/XiaoHuangShuServer/server/**/*
[17:39:11] [nodemon] starting `node server/server.js`
Express server running at localhost:3000
Attached router: /v1/hello_world

这里需要注意的是，我们在'nodemon'的回调里面返回了nodemon实例，其实我们完全可以不返回，将里面的return去掉，运行完全正常。

两者的区别是，有了return（这里的nodemon会返回一个stream），dev任务就会等待nodemon前置依赖任务执行完成才会执行。因为我们dev这个任务的回调里面什么事情也没有做，只是打印一行信息而已，所以依赖任务是否先执行完成并没有多大关系。但是，如果我们的dev需要做一些nodemon启动完成之后才能做的事情的话，这个return就变得很重要了。

更多相关信息请参考gulp的[官网](http://www.gulpjs.com.cn/docs/api/)描述:
>注意： 你的任务是否在这些前置依赖的任务完成之前运行了？请一定要确保你所依赖的任务列表中的任务都使用了正确的异步执行方式：使用一个 callback，或者返回一个 promise 或 stream。

## 1.2 nodemon选项
nodemon, 顾名思义，就是nodejs的monitor，专门用来监控nodejs的文件变动，然后帮助我们重启server。 

我们下面看下它有哪些主要选项，且这些选项是如何知道nodemon工作的:

- **script**: 指定我们启动服务器的入口文件。nodemon就是通过这个这个选项知道我们应该执行哪个文件的。
- **exec**: 执行入口文件的命令。nodemon就是通过这个选项知道我们应该如何执行我们的入口文件的。
- **watch**: 一个列表，表明哪些目录下的文件会被监控。
- **delay**: 监控到修改后，延时多长时间才进行重启。这个选项主要是解决频繁启动的情况，比如你现在一下子做了2次改动并连续保存了2次，那么服务器就会在检测到第一次修改后进行重启，重启后又注意到了之前的第二次改动，又进行一次重启。当代码量少的时候问题不大，但如果代码量大且启动需要比较长的时间的话，加个延时还是很有必要的。

这就是我们上面用到的主要几个nodemon的选项的意义，看完后我相信上面的代码也没有必要做过多的解析了。

# 2. nodejs调试方式
---
## 2.1 最新nodejs体验版调试方式

网上有很多介绍nodejs调试的方法，但是都比较老套了，用起来也比较麻烦。

其实自nodejs版本v6.3.0+后，nodejs就提供了一个体验版本的调试方式，且不用再依赖node-inspector工具。

我们在命令行中执行命令 node --inspect server/server.js
>appledeMBP:XiaoHuangShuServer apple$ node --inspect server/server.js 
Debugger listening on port 9229.
Warning: This is an experimental feature and could change at any time.
To start debugging, open the following URL in Chrome:
    **chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/e0a7ff37-b13a-40e8-a6d0-6f3de156a907**
Express server running at localhost:3000
Attached  router: /v1/hello_world

然后根据提示，将粗体的那行拷贝到chrome中执行，chrome就会自动打开调试工具:

![chrome-devtools.jpg](http://upload-images.jianshu.io/upload_images/264714-3c5ab875fc4c357f.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

然后我们就可以设置断点等进行调试了。

## 2.2 集成最新调试方法到gulp

我们可以通过修改gulpfile.js中的nodemon任务的代码来集成最新的调试方法：

``` js
const gulp = require('gulp');
const nodemon = require('gulp-nodemon');

gulp.task('nodemon', function () {
    return nodemon({
        verbose: false,
        exec: 'node --inspect',
        exec: 'node',
        script: 'server/server.js',
        watch: ['server'],
        delay: 2000,
    })
});

gulp.task('dev',['nodemon'], function () {
    console.log('dev started....');
});
```
但这里比较讨厌的是，每次我们修改代码重启之后，调试用的那个chrome url都会改变，所以都需要手动重新拷贝一次，这着实难以忍受。

后来从[medium的一篇文章](https://medium.com/@paul_irish/debugging-node-js-nightlies-with-chrome-devtools-7c4a1b95ae27)中找到解决办法。

首先，在chrome地址栏中输入："chrome://inspect":

![chrome-inspect.png](http://upload-images.jianshu.io/upload_images/264714-2922adce3502f0c8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

然后，通过点击"Open dedicated DevTools for Node"（中文估计是“打开专门调试Node的DevTools工具"， 我懒的找中文版核对了。大家知道就是图片中中间那个蓝色的连接就是了)，打开DevTools:

![devTools-Node.png](http://upload-images.jianshu.io/upload_images/264714-288610331fefae7d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

然后我们什么东西都不需要修改，就能够和上面在chrome一样进行调试了，且通过这个工具调试的优点是，就算gulp监控到代码改动而重启整个服务，这个工具也会自动重连，不需要我们干预。

# 3. 漂亮的Logger
---

我们代码中用的console.log，毕竟还是过于原始，打印出来的信息比较单调，缺乏的信息也比较多，比如时间戳等。

所以我们这里会换上一个更好的日记打印库，其中bunyan就是个很不错的选择，配合bunyan-prettystream的库，我们就可以打印出很漂亮的log出来。

在bunyan-prettystream的Readme中就有一个很简洁的例子:
https://github.com/mrrama/node-bunyan-prettystream

``` js

var bunyan = require('bunyan');
var PrettyStream = require('bunyan-prettystream');

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

var log = bunyan.createLogger({
        name: 'foo',
        streams: [{
            level: 'debug',
            type: 'raw',
            stream: prettyStdOut
        }]
});
```

我们简单修改下，并放在libs/logger.js中，作为我们整个系统的日记库来使用:

``` js
const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

const log = bunyan.createLogger({
    name: 'XiaoHuangShu',
    streams: [{
        level: 'debug',
        type: 'raw',
        stream: prettyStdOut
    }]
});

module.exports = log;
```

然后将其他代码文件中所有用到console.log的地方都换成log.debug,或者log.error等。

保存后，我们看下命令行的日记打印，是否信息齐全了很多，且格式也变得更好了。
>[2017-05-11T16:16:48.585Z] DEBUG: XiaoHuangShu/16532 on appledeMacBook-Pro.local: Express server running at localhost:3000
[2017-05-11T16:16:48.590Z]  INFO: XiaoHuangShu/16532 on appledeMacBook-Pro.local: Attached  router: /v1/hello_world

这里因为我懒的上截图，其实现实中打印出来的log是有颜色的，特漂亮。大家自己去试下吧。

# 4. 结语
---
最新的代码请可以从github中获取。
> -  git clone https://github.com/zhubaitian/XiaoHuangShuServer.git
- cd XiaoHuangShuServer/
- git checkout CH03
- npm install 
- **gulp dev**

请注意，最后的运行方式已经换成通过gulp来运行了。

---
>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**
