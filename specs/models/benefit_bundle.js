'use strict';

module.exports = function (mongoose, uuid) {
  let benefitBundleSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });

  benefitBundleSchema.hasAndBelongsToMany('benefits', { inverseOf: 'benefit_bundles' });
  benefitBundleSchema.hasAndBelongsToMany('service_areas', { inverseOf: 'benefit_bundles' })

  return mongoose.model('BenefitBundle', benefitBundleSchema);
};
