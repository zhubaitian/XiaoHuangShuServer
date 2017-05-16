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
