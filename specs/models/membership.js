'use strict';

module.exports = function (mongoose) {
  let membershipSchema = new mongoose.Schema({
    membership_type: { type: String }
  }, { timestamps: true });

  membershipSchema.belongsTo('user', { required: true, touch: true });
  membershipSchema.belongsTo('account');

  return mongoose.model('Membership', membershipSchema);
};
