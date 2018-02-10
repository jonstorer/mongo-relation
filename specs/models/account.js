'use strict';

module.exports = function (mongoose, uuid) {
  let accountSchema = new mongoose.Schema({
    account_number: {
      type: String,
      default: function () { return Date.now() }
    }
  });

  accountSchema.hasOne('subscription');

  return mongoose.model('Account', accountSchema);
};
