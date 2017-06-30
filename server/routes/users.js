const express = require('express');
const log = require('../libs/logger');
const util = require('../libs/util');

const User = require('../models/User.js');
const ClientError = require('../errors/ClientError');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    let query = {};
    const users = await User.find(query);
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.get('/:user_id', async (req, res, next) => {
  try {
    const userId = req.params.user_id;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new ClientError.NotFoundError();
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try {

    // Allow only one user, and the user should be an admin, currently.
    const hasUser = await User.findOne();
    if (!hasUser) {
      req.body.is_admin = true;
    } else {
      throw new ClientError.ForbiddenError();
    }

    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.delete('/:user_id', async (req, res, next) => {
  try {
    const userId = req.params.user_id;

    const user = await User.findOne({ _id: userId });

    await user.remove();
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.put('/:user', async (req, res, next) => {
  try {
    let query = {};
    if (util.isValidId(req.params.user)) {
      query = { _id: req.params.user };
    } else {
      res.status(400).send('Bad request.');
      return;
    }

    const user = await User.findOne(query);
    Object.assign(user, req.body);

    await user.save();
    res.json(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;