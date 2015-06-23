var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
  , MongooseArray = mongoose.Types.Array
  , i = require('i')()
  , utils = require('./utils')
  , merge  = utils.merge
  , HasAndBelongsToMany
  , associate;

module.exports = function hasAndBelongsToMany (schema, associationName, options) {
  this.type = 'habtm';
  this.schema  = schema;
  this.options = options || {};

  this.pathName = associationName;
  this.model    = this.options.modelName || i.classify(associationName);

  var path = {};
  path[this.pathName] = [{ type: ObjectId, index: true, ref: this.model }];
  this.schema.add(path);

  this.schema.paths[this.pathName].options[this.type] = this.model;
  this.schema.paths[this.pathName].options.relationshipType = this.type;
  this.schema.paths[this.pathName].options.relationshipModel = this.model;

  if (this.options.dependent) {
    this.schema.paths[this.pathName].options.dependent = this.options.dependent;
  }

  var setChild = this.options.hasOwnProperty('setChild') ? this.options.setChild : true;
  this.schema.paths[this.pathName].options.setChild = setChild;

  if (!this.schema.paths[this.pathName].options.setChild) {
    if (this.schema.paths[this.pathName].options.dependent == 'nullify') {
      throw new Error("dependent cannot be set to 'nullify' while setChild is false");
    }

    if (this.schema.paths[this.pathName].options.dependent == 'destroy') {
      throw new Error("dependent cannot be set to 'destroy' while setChild is false");
    }
  };
};

// Builds the instance of the child element
//
// @param {Object|Array} objs
// @return {Document|Array}
// @api public

MongooseArray.prototype.build = function (objs) {
  var childModelName = this._schema.options.relationshipModel;

  var buildOne = function(obj){
    var childModel = mongoose.model(obj.__t || childModelName)
      , child = new childModel(obj);

    this._parent[this._path].push(child);

    if (!!this._schema.options.setChild) {

      // start remove me asap
      // needed for this._childToParent.name
      model = mongoose.model(this._schema.options.relationshipModel);
      for (var path in model.schema.paths) {
        options = model.schema.paths[path].options;
        ref = (options.relationshipModel || options.ref);
        if(ref == this._parent.constructor.modelName){
          options.name = path;
          this._childToParent = options
        }
      }
      // end remove me asap

      child[this._childToParent.name].push(this._parent);
    }

    return child;
  }.bind(this);

  if (Array.isArray(objs)) {
    return objs.map(buildOne);
  } else {
    return buildOne(objs);
  }
};

// Create a child document and add it to the parent `Array`
//
// @param {Object|Array} objs [object(s) to create]
// @param {Functions} callback [passed: (err, parent, created children)]
// @api public

MongooseArray.prototype.create = function (objs, callback) {
  objs = this.build(objs);

  var complete = function(err, docs){
    this._parent.save(function(err){
      callback(err, this._parent, docs);
    }.bind(this));
  }.bind(this);

  var validForCreate = function(doc){
    if (!!this._schema.options.setChild) {

      // start remove me asap
      // needed for this._childToParent.name
      model = mongoose.model(this._schema.options.relationshipModel);

      for (var path in model.schema.paths) {
        options = model.schema.paths[path].options;
        ref = (options.relationshipModel || options.ref);
        if(ref == this._parent.constructor.modelName){
          options.name = path;
          this._childToParent = options
        }
      }

      this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));
      var childIsAllowed = function (child) {
        return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
      }.bind(this);

      // end remove me asap

      return !!this._childToParent && childIsAllowed(doc);
    } else {
      return true
    }
  }.bind(this);

  var createOne = function(doc, done){
    if (!validForCreate(doc))
      return done(new Error('Parent model not referenced anywhere in the Child Schema'));
    doc.save(done);
  };

  if(Array.isArray(objs)){
    var count = objs.length, docs = [];

    objs.forEach(function(obj){
      createOne(obj, function(err, doc){
        if (err) return complete(err);
        docs.push(doc);
        --count || complete(null, docs);
      }.bind(this));
    }.bind(this));
  }
  else {
    createOne(objs, complete);
  }
};

// Append an already instantiated document saves it in the process.
//
// @param {Document} child
// @param {Function} callback
// @api public

MongooseArray.prototype.append = function (child, callback) {

  // start remove me asap
  // needed for this._childToParent.name
  model = mongoose.model(this._schema.options.relationshipModel);

  for (var path in model.schema.paths) {
    options = model.schema.paths[path].options;
    ref = (options.relationshipModel || options.ref);
    if(ref == this._parent.constructor.modelName){
      options.name = path;
      this._childToParent = options
    }
  }

  this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));
  var childIsAllowed = function (child) {
    return !!~this._allowed_discriminators.indexOf(child.constructor.modelName);
  }.bind(this);

  // end remove me asap

  // TODO: abstract me
  if(!childIsAllowed(child)) {
    return throwErr('Wrong Model type');
  }

  if (!!this._schema.options.setChild) {
    child[this._childToParent.name].push(this._parent._id);
  }

  this._parent[this._path].push(child._id);

  callback && child.save(callback);
  return child;
};

// Append many instantiated children documents
//
// @param {Array} children
// @param {Function} callback
// @api public

MongooseArray.prototype._concat = MongooseArray.prototype.concat;
MongooseArray.prototype.concat = function (docs, callback) {
  var throwErr = utils.throwErr(callback);

  if (!Array.isArray(docs)){
    return throwErr('First argument needs to be an Array');
  };

  var complete = function(err, docs) {
    if(err){ return throwErr(err) }

    var ids = docs.map(function (doc) { return doc._id });
    this._concat(ids);
    this._markModified();

    callback(null, docs);
  }.bind(this);

  var count = docs.length;
  var savedDocs = [];
  docs.forEach(function(doc){
    this.append(doc);
    doc.save(function(err, doc){
      if(err) return complete(err);

      savedDocs.push(doc);
      --count || complete(null, savedDocs);
    });
  }.bind(this));

};

// Find children documents

// *This is a copy of Model.find w/ added error throwing and such*

MongooseArray.prototype.find = function (conditions, fields, options, callback) {
  // Copied from `Model.find`
  if ('function' == typeof conditions) {
    callback = conditions;
    conditions = {};
    fields = null;
    options = null;
  } else if ('function' == typeof fields) {
    callback = fields;
    fields = null;
    options = null;
  } else if ('function' == typeof options) {
    callback = options;
    options = null;
  }

  // start remove me asap
  // needed for this._childToParent.name
  model = mongoose.model(this._schema.options.relationshipModel);
  for (var path in model.schema.paths) {
    options = model.schema.paths[path].options;
    ref = (options.relationshipModel || options.ref);
    if(ref == this._parent.constructor.modelName){
      options.name = path;
      this._childToParent = options
    }
  }
  // end remove me asap

  var childModel     = mongoose.model(this._schema.options.relationshipModel);
      childPath      = this._childToParent;
      safeConditions = {},
      throwErr       = utils.throwErr(callback);

  merge(safeConditions, conditions);

  if (!!this._schema.options.setChild) {
    if (!childPath) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    var childConditions = {};
    childConditions[childPath.name] = this._parent._id;
    merge(safeConditions, childConditions);
  }

  merge(safeConditions, { _id: { $in: this._parent[this._path] } });

  var query = childModel.find(safeConditions, options).select(fields);

  callback && query.exec(callback);
  return query;
};

// Syntactic sugar to populate the array

// @param {Array} fields
// @param {Function} callback
// @return {Query}
// @api public

MongooseArray.prototype.populate = function (fields, callback) {
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  // TODO: do we really need to initialize a new doc?
  return this._parent.constructor
    .findById(this._parent._id)
    .populate(this._path, fields)
    .exec(callback);
};

// Overrides MongooseArray.remove only for dependent:destroy relationships

// @param {ObjectId} id
// @param {Function} callback
// @return {ObjectId}
// @api public

MongooseArray.prototype._remove = MongooseArray.prototype.remove;
MongooseArray.prototype.remove = MongooseArray.prototype.delete = function (id, callback) {
  var parent     = this._parent,
      childModel = mongoose.model(this._schema.options.relationshipModel);
      childPath  = this._childToParent;
      child      = null,
      throwErr   = utils.throwErr(callback);

  if (id._id) {
    var child = id;
    id = child._id;
  }

  // TODO: should a callback be required?
  if (!callback) {
    callback = function (err) {
      if (err) {
        throw err;
      }
    };
  }

  var hasOrFetchChild = function(done){
    if(child){
      done(null, child);
    } else {
      childModel.findById(id, done);
    };
  };

  // TODO: is this needed?
  // I think this removing the id from the instance array
  // however, it could be not needed
  MongooseArray.prototype._remove.call(this, id);

  // TODO: shold habtm support delete and destroy?
  if (!!~['delete', 'destroy', 'nullify'].indexOf(this._schema.options.dependent)){
    hasOrFetchChild(function(err, child){
      if (err) { return throwErr(err) };
      child[childPath.name].remove(parent._id);
      child.save(function(err, child){
        if (err){ return throwErr(err) };
        callback(null, parent);
      });
    });
  } else {
    callback(null, parent);
  }
};

// has and belongs to many

function HasAndBelongsToMany (path) {
  var ref, options, model;

  this.type = 'habtm';
  this._path = path;
  this._parent = path._parent;
  this._options = path._schema.options;
  this._childModelName = this._options.relationshipModel;
  this._parentModelName = this._parent.constructor.modelName;

  model = mongoose.model(this._options.relationshipModel);
  this._allowed_discriminators = [ model.modelName ].concat(Object.keys(model.discriminators || {}));

  for (var path in model.schema.paths) {
    options = model.schema.paths[path].options;
    ref = (options.relationshipModel || options.ref);
    if(ref == this._parentModelName){
      options.name = path;
      this._childToParent = options
    }
  }
}
