const bunyan = require('bunyan');
const PrettyStream = require('bunyan-prettystream');

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

const log = bunyan.createLogger({
    name: 'XiaoHuangShu',
    streams: [{
        level: 'debug',
        type: 'raw',
        stream: prettyStdOut
    }]
});

module.exports = log;