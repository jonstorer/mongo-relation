'use strict';

module.exports = function (mongoose) {
  let userSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });

  userSchema.hasMany('memberships');
  userSchema.hasMany('identities');
  userSchema.hasMany('notes', { as: 'notable' })

  return mongoose.model('User', userSchema);
};
