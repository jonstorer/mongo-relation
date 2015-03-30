// mongo-relations

module.exports = exports = function mongoRelations (mongoose) {
  var Schema = mongoose.Schema
    , habtmArrayFactory = require('./types/HasAndBelongsToManyArray')
    , belongsTo
    , hasAndBelongsToMany
    , hasMany;

  // register HasAndBelongsToMany Type
  mongoose.Types.HasAndBelongsToManyArray = require('./types/HasAndBelongsToManyArray')(mongoose.Types.Array)

  belongsTo = require('./belongsTo');
  hasAndBelongsToMany = require('./hasAndBelongsToMany');
  hasMany = require('./hasMany');

  Schema.prototype.belongsTo = function (model, options) {
    belongsTo(this, model, options);
  };

  Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  Schema.prototype.habtm = function (model, options) {
    hasAndBelongsToMany(this, model, options);
  };
  Schema.prototype.hasAndBelongsToMany = Schema.prototype.habtm;

  return mongoose;
};
