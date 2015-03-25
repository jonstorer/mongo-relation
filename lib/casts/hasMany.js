var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    i        = require('i')();

function HasMany (model, options) {
  options = options || {};
  this.model = model;
  this.foreignKey = options.inverse_of || i.underscore(this.model.constructor.modelName);
  this.associatedModel = options.associatedModel;
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
    Model = mongoose.model(this.associatedModel);
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
  var Model = mongoose.model(this.associatedModel);
  return Model.find(conditions, fields, options, callback);
};

HasMany.prototype.findOne = function(){};
HasMany.prototype.append = function(){};
HasMany.prototype.concat = function(){};
HasMany.prototype.remove = function(){};
HasMany.prototype.delete = function(){};

module.exports = function (schema, associatedModel, options) {
  options = options || {};
  options.associatedModel = associatedModel;
  var virtualName = options.virtualName = i.pluralize(i.underscore(associatedModel));

  schema.virtual(virtualName).get(function(){
    return new HasMany(this, options);
  });





  //this.type = 'hasMany';
  //this.schema  = schema;

  //this.model   = model;
  //this.options = options || {};

  //this.pathName = this.options.through || pluralize(this.model.toLowerCase());

  //var path = {};
  //path[this.pathName] = [{ type: ObjectId, index: true, ref: this.model }];
  //this.schema.add(path);

  //this.schema.paths[this.pathName].options[this.type] = this.model;
  //this.schema.paths[this.pathName].options.relationshipType = this.type;
  //this.schema.paths[this.pathName].options.relationshipModel = this.model;

  //if (this.options.dependent) {
    //this.schema.paths[this.pathName].options.dependent = this.options.dependent;
  //}

  //var setParent = this.options.hasOwnProperty('setParent') ? this.options.setParent : true;
  //this.schema.paths[this.pathName].options.setParent = setParent;

  //if (this.options.as) {
    //this.schema.paths[this.pathName].options.as = this.options.as;
  //};
};
