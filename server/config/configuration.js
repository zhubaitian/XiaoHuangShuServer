module.exports = {
  mongo: {
    url: 'mongodb://127.0.0.1:27017/xiaohuangshu',
  },
  redis: {
    host: '127.0.0.1',
    port: '6379',
  },
  auth: {
    ttl: 3600,
  },
  server: {
    protocol: 'http://',
    host: 'localhost:3000',
    version: 'v1',
  },
  upload: {
    to_upyun: true, // 是否上传到又拍云
  }
};

