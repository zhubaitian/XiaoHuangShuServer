const express = require('express');
const app = express();

const redis = require('./libs/redisdb');
const ClientError = require('./errors/ClientError');
const fs = require('fs');
const log = require('./libs/logger');
const Client = require('./errors/ClientError');

const bodyParser = require('body-parser')
const bodyParserXML = require('body-parser-xml');

// Middlewares to parse different format of request data to body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
bodyParserXML(bodyParser);
app.use(bodyParser.xml());

// Authentication middleware
app.use(require('./midware/auth'));

fs.readdir(`${__dirname}/routes/`, (err,files) => {
    for(const file of files) {
        const path = '/v1/' + file.split(".")[0];
        log.info('Attached  router:',path);
        app.use(path,require(`${__dirname}/routes/${file}`))
    }
})

// Start express server and listen to the PORT specified below
const PORT = 3000
app.listen(PORT, function() {
  log.debug('Express server running at localhost:' + PORT)
})
