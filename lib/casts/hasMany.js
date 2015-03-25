var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    i        = require('i')();

function HasMany (doc, options) {
  options = options || {};
  this._options = options;

  this.doc       = doc;
  this.modelName = this.doc.constructor.modelName;
  this.Model     = mongoose.model(this.modelName);

  this.associationModelName = this._options.associationModelName;
  this.associationModel     = mongoose.model(this.associationModelName);

  if(this._options.as){
    this.foreignKey = this._options.as;
    this.foreignKeyType = this._options.as + '_type';
  }
  else {
    this.foreignKey = this._options.inverse_of || i.underscore(this.modelName);
  }
}

HasMany.prototype.build = function(objects){
  var Model;

  if(Array.isArray(objects)){
    return objects.map(function(object){
      return this.build(object);
    }.bind(this));
  }
  else {
    return this.push(new this.associationModel(objects || {}));
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

HasMany.prototype.find = function(conditions, fields, options, callback){
  if('function' == typeof conditions){
    callback = conditions;
    conditions = {};
  }

  conditions = conditions || {};
  fields = fields || null;
  options = options || {};

  this.push(conditions);
  return this.associationModel.find(conditions, fields, options, callback);
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

HasMany.prototype.concat = function(objects, callback){
  var docs = [];

  if(Array.isArray(objects)){
    var count = objects.length;

    objects.forEach(function(object){
      this.concat(object, function(err, doc){
        if(err) return callback(err);
        docs.push(doc);
        --count || callback(null, docs);
      });
    }.bind(this));
  }
  else {
    this.push(objects).save(callback);
  };
};
HasMany.prototype.append = HasMany.prototype.concat;

HasMany.prototype.push = function(objects){
  if(Array.isArray(objects)){
    return objects.map(function(object){ return this.push(object); }.bind(this));
  }
  else {
    objects[this.foreignKey] = this.doc._id;
    if(this.foreignKeyType){
      objects[this.foreignKeyType] = this.modelName;
    }
    return objects;
  };
};

HasMany.prototype.remove = function(){};
HasMany.prototype.delete = function(){};

module.exports = function (schema, associationName, options) {
  options = options || {};
  options.associationName = associationName;
  options.associationModelName = associationModelName = i.classify(associationName);

  schema.virtual(associationName).get(function(){
    return new HasMany(this, options);
  });

  switch(options.dependent){
    case 'destroy':
      schema.pre('remove', function(next){
        this[associationName].find().remove(next);
      });
      break;
    case 'nullify':
      schema.pre('remove', function(next){
        var Model = this[associationName].associationModel
          , conditions = this[associationName].find()._conditions
          , fieldsToUnset = this[associationName].find()._conditions
          , options = { multi: true };

        for (field in fieldsToUnset){ fieldsToUnset[field] = 1; }

        Model.update(conditions, { $unset: fieldsToUnset }, options, next);
      });
      break;
  }

};
