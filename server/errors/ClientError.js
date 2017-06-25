const createError = require('create-error');

module.exports = {
  SmsError: createError(Error, 'SmsError', {status: 400, code: 500001, message: 'Send sms failed!'}),

  InvalidLoginError: createError(Error, 'InvalidLoginError', { status: 401, code: 401001, message: 'Invalid username or password.' }),
  InvalidTokenError: createError(Error, 'InvalidTokenError', { status: 401, code: 401002, message: 'Invalid token.' }),

  NotFoundError: createError(Error, 'NotFoundError', { status: 404, code: 404001, message: 'Not Found!' }),

  ForbiddenError: createError(Error, 'ForbiddenError', { status: 403, code: 403001, message: 'Operation Forbidden!' }),

};
