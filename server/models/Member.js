'use strict';

const Schema = require('mongoose').Schema;
const db = require('../libs/mongodb');


const MemberSchema = new Schema({
  nickname: { type: String, default: '小黄人', required: true },   // 名字。会员昵称
  password: { type: String, required: false },                      // User password
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

MemberSchema.statics.findByOpenId = function(wxOpenId) {
  return this.findOne({'bindings.wechat.openid': wxOpenId});
}

MemberSchema.statics.findByMobieNumber = function(mobile) {
  return this.findOne({'bindings.mobile.number': mobile});
}

MemberSchema.options.toJSON = {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
};


module.exports = db.model('Member', MemberSchema);
