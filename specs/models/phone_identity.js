'use strict';

module.exports = function (mongoose, Identity) {
  let phoneIdentitySchema = new mongoose.Schema({
    phone_number: { type: String },
    verified: { type: Boolean }
  }, { timestamps: true });

  return Identity.discriminator('PhoneIdentity', phoneIdentitySchema);
};
