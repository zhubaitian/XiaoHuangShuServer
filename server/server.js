const express = require('express');
const app = express();

const fs = require('fs');

const bodyParser = require('body-parser')
const bodyParserXML = require('body-parser-xml');

// Middlewares to parse different format of request data to body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
bodyParserXML(bodyParser);
app.use(bodyParser.xml());

fs.readdir(`${__dirname}/routes/`, (err,files) => {
    for(const file of files) {
        const path = '/v1/' + file.split(".")[0];
        console.log('Attaching router:',path);
        app.use(path,require(`${__dirname}/routes/${file}`))
    }
})

// Start express server and listen to the PORT specified below
const PORT = 3000
app.listen(PORT, function() {
  console.log('Express server running at localhost:' + PORT)
})
