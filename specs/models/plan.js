'use strict';

module.exports = function (mongoose, uuid) {
  let planSchema = new mongoose.Schema({
    name: { type: String }
  });

  planSchema.hasAndBelongsToMany('benefits', { inverseOf: 'plans' });

  return mongoose.model('Plan', planSchema);
};
