'use strict';

const express = require('express');
const fs = require('fs');
const multer = require('multer');
const log = require('../libs/logger');
const util = require('../libs/util');

const uuid = require('uuid');
const ClientError = require('../errors/ClientError');

const Image = require('../models/Image');
const path = require('path');
const config = require('../config/configuration');
const confidential = require('../config/confidential');

/*
upload: {
  protocol: 'http://',
  host: 'xiaohuangshu.b0.upaiyun.com',
  bucket: 'xiaohuangshu',
  operator: 'xxxxx',
  password: 'xxxxxxxx',
},
*/

const UPYUN = require('upyun');
const upyun = new UPYUN(confidential.upload.bucket,
    confidential.upload.operator,
    confidential.upload.password,
    confidential.upload.endpoint,
    {apiVersion:confidential.upload.api_version});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const fileFormat = (file.originalname).split(".");
    const random = uuid.v4();
    cb(null, random  + "." + fileFormat[fileFormat.length - 1]);
  },

});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {fileSize: 3 * 1024 * 1024}, // 3MB file size limits
});

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const query = {};

    const files = await Image.find(query);
    res.json(files);
  } catch (e) {
    next(e);
  }
});

router.post('/', upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400).send('Missing file content');
            return;
        }

        let image = {};
        let filename = '';

        filename = `${req.file.filename}`;
        image = {
            filename,
            original: req.file.originalname,
            size: req.file.size,
            mime_type: req.file.mimetype,
            url: `${config.server.protocol}${config.server.host}/${config.server.version}/uploads/${filename}`
        };

        if (config.upload.to_upyun) {
            upyun.putFile(filename, req.file.path, req.file.mimetype, true, {}, async(err, result) => {
                if (err) {
                    log.error('Upyun error', err, err.stack);
                    res.status(500).send('Failed to sync to cdn server');
                    return;
                }
                if (result.statusCode !== 200) {
                    log.error('Upyun error', result);
                    res.status(500).send('Upyun response with error');
                    return;
                }

                image.url = confidential.upload.protocol + confidential.upload.host + '/' + filename;
                const imageFile = new Image(image);
                await imageFile.save();
                res.send(imageFile);
            })
        } else {
            const imageFile = new Image(image);
            await imageFile.save();
            res.send(imageFile);
        }

    } catch (e) {
        next(e);
    }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const query = {};

    query._id = req.params.id;

    const file = await Image.findOne(query);
    if (!file) {
      throw new ClientError.NotFoundError();
    }

    fs.unlink(`uploads/${file.filename}`, async (fserr) => {
      if (fserr) {
        log.error('Failed to remove upload tmp file', `uploads/${file.filename}`);
        res.status(500).send('Failed to del file');
        return;
      }

      if (config.upload.to_upyun) {
          upyun.deleteFile(file.filename, async(err, result) => {
              if (err) {
                  log.error('Upyun error', err, err.stack);
                  res.status(500).send('Failed to del cdn server');
                  return;
              }
              if (result.statusCode !== 200) {
                  log.error('Upyun error', result);
                  res.status(500).send('Upyun response with error');
                  return;
              }

              await file.remove();
              res.status(204).end();
          });
      } else {
          await file.remove();
          res.status(204).end();
      }
    });


  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const query = {};

    query._id = req.params.id;

    const file = await Image.findOne(query);
    if (!file) {
      throw new ClientError.NotFoundError();
    }

    res.json(file);

  } catch (e) {
    next(e);
  }
});

module.exports = router;
