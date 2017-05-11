const express = require('express');
const log = require('../libs/logger');
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
    res.send(`Here is the helloworld you need!`);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
