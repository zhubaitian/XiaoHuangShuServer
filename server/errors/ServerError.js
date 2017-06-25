const createError = require('create-error');

module.exports = {
  ServerError: createError(Error, 'ServerError', {status: 500, code: 500001, message: 'Internal Server Error'}),
}