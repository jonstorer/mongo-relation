// mongo-relations

module.exports = exports = function mongoRelations (mongoose) {
  var Schema = mongoose.Schema
    , MongooseArray = mongoose.Types.Array
    , belongsTo = require('./casts/belongsTo')
    , hasAndBelongsToMany = require('./casts/hasAndBelongsToMany')
    , hasMany = require('./casts/hasMany')
    , Relationship = require('./relationship');

  Schema.prototype.belongsTo = function (model, options) {
    belongsTo(this, model, options);
  };

  Schema.prototype.hasMany = function (model, options) {
    hasMany(this, model, options);
  };

  Schema.prototype.habtm = function (model, options) {
    new hasAndBelongsToMany(this, model, options);
  };

  MongooseArray.prototype.build = function (objs) {
    return (new Relationship(this)).build(objs);
  };

  MongooseArray.prototype.create = function (objs, callback) {
    return (new Relationship(this)).create(objs, callback);
  };

  MongooseArray.prototype.find = function (conditions, fields, options, callback) {
    return (new Relationship(this)).find(conditions, fields, options, callback);
  };

  MongooseArray.prototype.populate = function (fields, callback) {
    return (new Relationship(this)).populate(fields, callback);
  }

  MongooseArray.prototype.append = function (child, callback) {
    return (new Relationship(this)).append(child, callback);
  };

  MongooseArray.prototype._concat = MongooseArray.prototype.concat;
  MongooseArray.prototype.concat = function (children, callback) {
    return (new Relationship(this)).concat(children, callback);
  };

  MongooseArray.prototype._remove = MongooseArray.prototype.remove;
  MongooseArray.prototype.remove = MongooseArray.prototype.delete = function (id, callback) {
    return (new Relationship(this)).delete(id, callback);
  };

  return mongoose;
};
