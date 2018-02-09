'use strict';

module.exports = function (mongoose) {
  let Schema = ;
  let belongsTo = require('./belongsTo');
  let hasMany = require('./hasMany');
  let hasAndBelongsToMany = require('./hasAndBelongsToMany');
  let mongooseArrayDecorater = require('./arrayDecorator');

  /* Syntactic sugar to create the relationships
  *
  * @param {String} model [name of the model in the DB]
  * @param {Object} options [through, dependent]
  * @return {Schema}
  * @api public
  */
  mongoose.Schema.prototype.belongsTo = function (model, options) {
    belongsTo(this, model, options);
  };

  mongoose.Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  mongoose.Schema.prototype.habtm = function (model, options) {
    hasAndBelongsToMany(this, model, options);
  };

  Schema.prototype.hasAndBelongsToMany = Schema.prototype.habtm;

  return mongoose;
};
