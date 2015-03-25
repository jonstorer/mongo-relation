var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    i        = require('i')();

function HasMany (model, options) {
  options = options || {};
  this.model = model;
  this.foreignKey = options.inverse_of || i.underscore(this.model.constructor.modelName);
  this.associationModel = options.associationModel;
}

HasMany.prototype.build = function(objects){
  var Model;

  if(Array.isArray(objects)){
    return objects.map(function(object){
      return this.build(object);
    }.bind(this));
  }
  else {
    attributes = objects || {};
    attributes[this.foreignKey] = this.model._id;
    Model = mongoose.model(this.associationModel);
    return new Model(attributes);
  }
};

HasMany.prototype.create = function(objects, callback){
  if(Array.isArray(objects)){
    var docs = [], count = objects.length;

    objects.forEach(function(object){
      this.create(object, function(err, doc){
        if(err) return callback(err);
        docs.push(doc);
        --count || callback(null, docs);
      });
    }.bind(this));
  }
  else {
    this.build(objects).save(callback);
  };
};

//Model.find(conditions, [fields], [options], [callback])
HasMany.prototype.find = function(conditions, fields, options, callback){
  if('function' == typeof conditions){
    callback = conditions;
    conditions = {};
  }

  conditions = conditions || {};
  fields = fields || null;
  options = options || {};

  conditions[this.foreignKey] = this.model._id;
  var Model = mongoose.model(this.associationModel);
  return Model.find(conditions, fields, options, callback);
};

HasMany.prototype.findOne = function(){
  var callback
    , args = Array.prototype.slice.call(arguments);

  if('function' == typeof args[args.length - 1]){
    callback = args[args.length - 1];
    args.pop();
  }

  return this.find.apply(this, args).findOne(callback);
};

HasMany.prototype.append = function(objects, callback){
  var docs = [];

  if(Array.isArray(objects)){
    var count = objects.length;

    objects.forEach(function(object){
      this.append(object, function(err, doc){
        if(err) return callback(err);
        docs.push(doc);
        --count || callback(null, docs);
      });
    }.bind(this));
  }
  else {
    objects[this.foreignKey] = this.model._id;
    objects.save(callback);
  };
};

HasMany.prototype.concat = HasMany.prototype.append;
HasMany.prototype.remove = function(){};
HasMany.prototype.delete = function(){};

module.exports = function (schema, associationName, options) {
  options = options || {};
  options.associationName = associationName;
  options.associationModel = i.classify(associationName);

  schema.virtual(associationName).get(function(){
    return new HasMany(this, options);
  });
};
