'use strict';

module.exports = function (mongoose, uuid) {
  let benefitBundlePriceSchema = new mongoose.Schema({
    price: { type: Number },
    currency: { type: String, enum: [ 'USD', 'GBP', 'CAD' ] }
  }, { timestamps: true });

  benefitBundlePriceSchema.belongsTo('plan', { required: true });
  benefitBundlePriceSchema.belongsTo('availability_zone', { modelName: 'ServiceArea', required: true });
  benefitBundlePriceSchema.belongsTo('benefit_bundle', { required: true });

  return mongoose.model('BenefitBundlePrice', benefitBundlePriceSchema);
};
