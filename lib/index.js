'use strict';

require('./polyfill');

let i = require('i')();
let utils = require('./utils');

module.exports = function mongooseRelation (mongoose) {
  mongoose = require('./mongooseArrayDecorator')(mongoose);

  mongoose.Schema.prototype.hasOne = require('./hasOne')(mongoose, i);
  mongoose.Schema.prototype.belongsTo = require('./belongsTo')(mongoose, i);
  mongoose.Schema.prototype.hasMany = require('./hasMany')(mongoose, i);
  mongoose.Schema.prototype.habtm = require('./hasAndBelongsToMany')(mongoose, i);

  mongoose.Schema.prototype.hasAndBelongsToMany = mongoose.Schema.prototype.habtm;

  return mongoose;

};
