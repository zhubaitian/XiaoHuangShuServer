'use strict';
const db = require('../libs/mongodb');
const log = require('../libs/logger');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 8;

const UserSchema = new db.Schema({
  name: { type: String, required: true },                          // User name
  password: { type: String, required: true },                      // User password
  type: { type: String, required: true },                          // User type, supports string: platform|user
  is_admin: { type: Boolean, required: true, default: false },                      // Admin get full acess to all APIs, the first created user would become an admin
});

UserSchema.methods = {
  authenticate: function (plainPassword) {
    log.debug('plainPassword:',plainPassword);
    log.debug('.this.password:',this.password);
    return bcrypt.compareSync(plainPassword, this.password);
  }
};

UserSchema.options.toJSON = {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
};

UserSchema.pre('save', function(next) {
  if(this.password) {
    const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR)
    this.password  = bcrypt.hashSync(this.password, salt)
  }
  next()
})

module.exports = db.model('User', UserSchema);
