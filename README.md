# 小白如何入门全栈开发

### 前言
---

本教程的主要目的是想从最基础简单的概念入手，记录下自己是如何从小白到入门全栈开发的过程，以便自己查阅。 当然，如果能给后来者带来那么一点点的帮助，那将甚是欣慰。

### 项目命名
---

一直挺喜欢内容电商小红书这款产品。所以，我想，去模仿小红书来做为一个入门项目应该是个不错的选择。那么，我们不妨就叫我们这个产品以及项目名称为**小黄书**吧。

当然，因为这只是一个入门项目，我们不可能实现所有小红书的功能。我的想法，只要前后端的基本框架给搭建好了，并理解每个模块的一些基本概念，那么我们入门的目的就已经达到了，剩下的也就是我们如何依葫芦画瓢去填代码逻辑而已了。

### 软件模块和主要涉及技术点
---
大体上，整个项目会分为以下几块:

- **[小黄书服务端](https://github.com/zhubaitian/XiaoHuangShuServer)**: 主要负责处理API请求服务。其中涉及到的技术点主要应该有: Nodejs, Express, ES6, Mongodb, Redis, Restful API等

- ***[小黄书平台管理](https://github.com/zhubaitian/XiaoHuangShuPlatform)**: 管理员可以通过平台管理页面来对小黄书进行管理，比如商品的管理等。主要涉及到的技术点应该有：Angularjs 2.0

- ***[小黄书微信小程序](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu)**: 尝试在小程序上实现小黄书的功能（这里肯定有些功能必须要原生app才能完成的了，但是无所谓，我觉得还是很有必要去体验下如今风头正茂的小程序）。这里主要涉及的技术点当然就是小程序开发了。

- **Devops**: 这一块主要是Devops相关的一些知识。比如Docker的运用，持续部署CD等。

- **网页客户端**: 主要的知识点是Vue.js，HTML5, Webpack等

其中前面带*号的会优先去实现的，其他的就要看时间而定了。

### 目录
- [小黄书服务端](https://github.com/zhubaitian/XiaoHuangShuServer)
  * [第一章 Insomnia及HelloWorld](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH01-Initial-Setup)
  * [第二章 路由级中间件及SRP单一职责原则](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH02)
  * [第三章 更高效的nodejs调试](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH03)
  * [第四章 mongodb和用户管理](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH04)
  * [第五章 redis和鉴权](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH05)
  * [第六章 文件上传服务器](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH06)
  * [第七章 文件上传到CDN](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH07)
  * [第八章 手机短信验证码8](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH08)
  * [第九章 会员管理及微信授权登录](https://github.com/zhubaitian/XiaoHuangShuServer/tree/CH09)
  * 第十章 待续？

- [小黄书微信小程序](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu)
  * [第一章 导航栏和标题栏界面](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu/tree/CH01)
  * [第二章 主页面搜索栏和flex布局](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu/tree/CH02)
  * [第三章 主页面标签栏水平滑动和下拉弹出框](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu/tree/CH03)
  * [第四章 图片高度自适应及上拉无限加载及下拉更新](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu/tree/CH04)
  * [第五章 微信小程序授权登录](https://github.com/zhubaitian/XiaoHuangShuXiaoChengXu/tree/CH05)
  * 第六章 待续？

- [小黄书管理后台](https://github.com/zhubaitian/XiaoHuangShuPlatform)

  * [第一章 Angularjs2.0基础及ng2-admin概览](https://github.com/zhubaitian/XiaoHuangShuPlatform/tree/CH01)
  * [第二章 Angularjs 2.0应用的国际化](https://github.com/zhubaitian/XiaoHuangShuPlatform/tree/CH01)
  * [第三章 登录页面和模型驱动表单](https://github.com/zhubaitian/XiaoHuangShuPlatform/tree/CH02)
  * [第四章 登录服务的实现](https://github.com/zhubaitian/XiaoHuangShuPlatform/tree/CH03)
  * 待续？

其中待续项目指的是不一定继续往下更新。如之前所言，个人认为有了这些基本框架和概念，剩下的也就是按照自己的需要去填写代码而已。

>本文由天地会珠海分舵编写，转载需授权，喜欢点个赞，吐槽请评论，进一步交流请关注公众号**techgogogo**或者直接联系本人微信**zhubaitian1**












