'use strict';

module.exports = function (mongoose) {
  let membershipSchema = new mongoose.Schema({
    membership_type: { type: String }
  });

  membershipSchema.belongsTo('user');
  membershipSchema.belongsTo('account');

  return mongoose.model('Membership', membershipSchema);
};
