'use strict';

module.exports = {
  isValidId: (id) => /^[0-9a-fA-F]{24}$/.test(id),
};
