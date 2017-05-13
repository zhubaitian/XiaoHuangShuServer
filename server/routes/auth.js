const express = require('express');
const User = require('../models/User');
const log = require('../libs/logger');
const ClientError = require('../errors/ClientError');
const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const {name, password} = req.body;

    const user = await User.findOne({name})
        .select('password').exec();

    if (!user.authenticate(password)) {
      throw new ClientError.InvalidLoginError();
    } else {
      res.send('Authentication passed');
    }

  } catch (e) {
    log.error('Exception:',e);
    next(e);
  }
});


module.exports = router;
