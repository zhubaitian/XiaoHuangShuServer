'use strict';

const express = require('express');

const log = require('../libs/logger');
const Member = require('../models/Member.js');
const ClientError = require('../errors/ClientError');

const router = express.Router();


/**
 路由功能: 获取所有会员列表
 访问权限: 平台管理员
 **/
router.get('/', async (req, res, next) => {
  try {
    if (req.user.type !== 'platform') {
      throw new ClientError.ForbiddenError();
    }
    let query = {};
    const members = await Member.find(query);
    res.json(members);
  } catch (e) {
    next(e);
  }
});

/**
 路由功能: 获取指定会员信息
 访问权限: 所有用户和会员
 **/
router.get('/:id', async (req, res, next) => {
  try {
    let query = {};
    if ((req.params.id)) {
      query = {_id: req.params.id};
    } else {
      res.status(400).send('Bad Request');
      return;
    }

    const member = await Member.findOne(query)
        .select('+bindings');

    if (!member) {
      res.status(404).send('Not Found.');
      return;
    }

    res.json(member);
  } catch (e) {
    next(e);
  }
});

/**
 路由功能: 删除指定会员
 访问权限: 平台管理员
 **/
router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.type !== 'platform') {
      throw new ClientError.ForbiddenError();
    }

    let query = {};
    if ((req.params.id)) {
      query = {_id: req.params.id};
    } else {
      res.status(400).send('Bad Request');
      return;
    }

    const member = await Member.findOne(query);
    if (!member) {
      log.warn('member not found');
      next();
      return;
    }

    await member.remove();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
