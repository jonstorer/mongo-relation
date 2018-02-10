'use strict';

module.exports = function (mongoose, uuid) {
  let benefitSchema = new mongoose.Schema({
    name: { type: String }
  });

  benefitSchema.hasAndBelongsToMany('plans', { inverseOf: 'benefits' });

  return mongoose.model('Benefit', benefitSchema);
};
