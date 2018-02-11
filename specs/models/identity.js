'use strict';

module.exports = function (mongoose) {
  let identitySchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });

  identitySchema.belongsTo('user');

  return mongoose.model('Identity', identitySchema);
};
