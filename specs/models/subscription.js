'use strict';

module.exports = function (mongoose, uuid) {
  let subscriptionSchema = new mongoose.Schema({
    status: { type: String }
  });

  subscriptionSchema.hasMany('plans');

  return mongoose.model('Subscription', subscriptionSchema);
};
