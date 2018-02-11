'use strict';

module.exports = function (mongoose, uuid) {
  let planSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });


  planSchema.hasMany('benefit_bundle_prices')

  planSchema.hasAndBelongsToMany('benefit_bundles', { inverseOf: 'plans' });
  planSchema.hasAndBelongsToMany('launched_service_areas', {
    modelName: 'ServiceArea',
    inverseOf: 'plans'
  });

  return mongoose.model('Plan', planSchema);
};
