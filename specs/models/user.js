'use strict';

module.exports = function (mongoose) {
  let userSchema = new mongoose.Schema({
    name: { type: String }
  });

  userSchema.hasMany('memberships');

  return mongoose.model('User', userSchema);
};
