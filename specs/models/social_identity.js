'use strict';

module.exports = function (mongoose, Identity) {
  let socialIdentitySchema = new mongoose.Schema({
    identity_provider_name: { type: String },
    identity_provider_id: { type: String },
    access_token: { type: String },
    refresh_token: { type: String },
    expires_at: { type: Date }
  }, { timestamps: true });

  return Identity.discriminator('SocialIdentity', socialIdentitySchema);
};
