'use strict';

module.exports = function (mongoose, uuid) {
  let benefitSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });

  benefitSchema.hasAndBelongsToMany('benefit_bundles', { inverseOf: 'benefits' });

  return mongoose.model('Benefit', benefitSchema);
};
