'use strict';

module.exports = function (mongoose) {
  let belongsTo = require('./belongsTo');
  let hasMany = require('./hasMany');
  let hasAndBelongsToMany = require('./hasAndBelongsToMany');
  let mongooseArrayDecorator = require('./mongooseArrayDecorator');

  mongoose = mongooseArrayDecorator(mongoose);

  mongoose.Schema.prototype.belongsTo = function (model, options) {
    belongsTo(this, model, options);
  };

  mongoose.Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  mongoose.Schema.prototype.habtm = function (model, options) {
    hasAndBelongsToMany(this, model, options);
  };

  mongoose.Schema.prototype.hasAndBelongsToMany = mongoose.Schema.prototype.habtm;

  return mongoose;
};
