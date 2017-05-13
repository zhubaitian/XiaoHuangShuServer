const createError = require('create-error');

module.exports = {
  InvalidLoginError: createError(Error, 'InvalidLoginError', { status: 401, code: 401001, message: 'Invalid username or password.' }),

  NotFoundError: createError(Error, 'NotFoundError', { status: 404, code: 404001, message: 'Not Found!' }),

  ForbiddenError: createError(Error, 'ForbiddenError', { status: 403, code: 403001, message: 'Operation Forbidden!' }),

};
