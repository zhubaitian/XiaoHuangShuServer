/**
 * Created by KevinZhu on 17/05/2017.
 */
const config = require('../config/configuration');
const luosimao = require('./luosimao');
const yunpian = require('./yunpian');

if (config.sms.yunpian) {
    module.exports = yunpian;
} else if(config.sms.luosimao)  {
    module.exports = luosimao;
} else {
    module.exports = yunpian;  // by default
}