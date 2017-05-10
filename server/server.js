const express = require('express');
const app = express();

const bodyParser = require('body-parser')
const bodyParserXML = require('body-parser-xml');

// Middlewares to parse different format of request data to body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
bodyParserXML(bodyParser);
app.use(bodyParser.xml());

// Middleware to handle helloworld request
app.use('/v1/helloworld', (req,res,next) => {
    try {
        const {subject} = req.body;
        res.send(`Hello ${subject}`);
    } catch (e) {
        next(e);
    }
})

// Start express server and listen to the PORT specified below
const PORT = 3000
app.listen(PORT, function() {
  console.log('Express server running at localhost:' + PORT)
})
