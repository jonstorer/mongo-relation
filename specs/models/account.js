'use strict';

module.exports = function (mongoose, uuid) {
  let accountSchema = new mongoose.Schema({
    account_number: {
      type: String,
      default: function () { return Date.now() }
    }
  }, { timestamps: true });

  accountSchema.hasOne('subscription');
  accountSchema.hasMany('notes', { as: 'notable' });
  accountSchema.hasMany('memberships');

  return mongoose.model('Account', accountSchema);
};
