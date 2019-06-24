'use strict';

module.exports = function (mongoose, Identity) {
  let emailIdentitySchema = new mongoose.Schema({
    email: { type: String },
    verified: { type: Boolean }
  }, { timestamps: true });

  return Identity.discriminator('EmailIdentity', emailIdentitySchema);
};
