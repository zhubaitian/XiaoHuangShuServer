const createError = require('create-error');

module.exports = {
  SmsError: createError(Error, 'SmsError', {status: 400, code: 400001, message: 'Send sms failed!'}),
  GetOpenIdError: createError(Error, 'GetOpenIdError', { status: 400, code: 400002, message: 'Failed to get openid from weixin by code.' }),
  MemberNotExistError: createError(Error, 'MemberNotExistError', { status: 400, code: 400003, message: 'Member does not exist.' }),
  MemberExistError: createError(Error, 'MemberExistError', { status: 400, code: 400004, message: 'Member already exist.' }),

  InvalidLoginError: createError(Error, 'InvalidLoginError', { status: 401, code: 401001, message: 'Invalid username or password.' }),
  InvalidTokenError: createError(Error, 'InvalidTokenError', { status: 401, code: 401002, message: 'Invalid token.' }),
  NotSignInError: createError(Error, 'NotSignInError', { status: 401, code: 401003, message: 'Not sign in yet' }),
  VerificationCodeIncorrect: createError(Error, 'VerificationCodeIncorrect', { status: 401, code: 401004, message: 'Verification code is not correct.' }),
  InvalidWxLoginError: createError(Error, 'InvalidWxLoginError', { status: 401, code: 401005, message: 'Wechat authentication login failed.' }),

  NotFoundError: createError(Error, 'NotFoundError', { status: 404, code: 404001, message: 'Not Found!' }),

  ForbiddenError: createError(Error, 'ForbiddenError', { status: 403, code: 403001, message: 'Operation Forbidden!' }),

};
