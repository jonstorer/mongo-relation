'use strict';

module.exports = function (mongoose, uuid) {
  let serviceAreaSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });


  serviceAreaSchema.hasAndBelongsToMany('plans')
  serviceAreaSchema.hasMany('benefit_bundle_prices')

  return mongoose.model('ServiceArea', ServiceAreaSchema);
};
