var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
  , MongooseArray = mongoose.Types.Array
  , i = require('i')()
  , utils = require('./utils')
  , merge  = utils.merge
  , async = require('async')
  , CollectionMixin = {};

module.exports = function hasAndBelongsToMany (schema, model, options) {
  this.type = 'habtm';

  this.schema  = schema;
  this.model   = model;
  this.options = options || {};

  this.pathName = this.options.through || i.pluralize(this.model.toLowerCase());

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
    //console.log(options);
    ref = (options.relationshipModel || options.ref);
    if(ref == this._parentModelName){
      options.name = path;
      this._childToParent = options
    }
  }
}

/* Builds the instance of the child element
*
* @param {Object|Array} objs
* @return {Document|Array}
* @api public
*/

MongooseArray.prototype.build = function (objs) {
  var childModelName = this._schema.options.relationshipModel;

  var buildOne = function(obj){
    var childModel = modelFor(objs.__t || childModelName)
      , child = new childModel(objs);

    this._parent[this._path].push(child);

    if (!!this._schema.options.setChild) {
      model = mongoose.model(this._schema.options.relationshipModel);
      for (var path in model.schema.paths) {
        options = model.schema.paths[path].options;
        ref = (options.relationshipModel || options.ref);
        if(ref == this._parent.constructor.modelName){
          options.name = path;
          this._childToParent = options
        }
      }

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

HasAndBelongsToMany.prototype.build = function(objs){
  if (Array.isArray(objs)) {
    return objs.map(function (obj) {
      return this.build(obj);
    }.bind(this));
  } else {
    var childModel = modelFor(objs.__t || this._childModelName)
      , child = new childModel(objs);

    this._path._parent[this._path._path].push(child);

    if (!!this._path._schema.options.setChild) {
      child[this._childToParent.name].push(this._path._parent);
    }

    return child;
  }
};

HasAndBelongsToMany.prototype.create = function (objs, callback) {
  objs = this.build(objs);

  var complete = function(err, docs){
    this._parent.save(function(err){
      callback(err, this._parent, docs);
    }.bind(this));
  }.bind(this);

  var validForCreate = function(doc){
    if (!!this._path._schema.options.setChild) {
      return !!this._childToParent && childIsAllowed.bind(this)(doc);
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

HasAndBelongsToMany.prototype.append = function(child, callback){
  var self      = this._path,
      parent    = self._parent,
      childPath = this._childToParent;
      throwErr  = utils.throwErr(callback);

  // TODO: abstract me
  if(!childIsAllowed.call(this, child)) {
    return throwErr('Wrong Model type');
  }

  if (!!this._path._schema.options.setChild) {
    child[childPath.name].push(parent._id);
  }

  parent[self._path].push(child._id);

  callback && child.save(callback);
  return child;
};

// XXX: does not save parent
HasAndBelongsToMany.prototype.concat = function(children, callback){
  var throwErr = utils.throwErr(callback);

  if (!Array.isArray(children)){
    return throwErr('First argument needs to be an Array');
  };

  var self     = this._path,
      children = children.map(function (child) { return self.append(child); });

  var saveChild = function(child, next) {
    child.save(next);
  };

  var completeHandler = function(err, savedChildren) {
    if(err){ return throwErr(err) }

    var ids = savedChildren.map(function (child) { return child._id });
    MongooseArray.prototype._concat.call(self, ids);

    self._markModified();
    callback(null, savedChildren);
  };

  async.mapSeries(children, saveChild, completeHandler);
};

HasAndBelongsToMany.prototype.find = function(conditions, fields, options, callback){
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

  var self           = this._path,
      parent         = self._parent,
      childModel     = modelFor(this._childModelName);
      childPath      = this._childToParent;
      safeConditions = {},
      throwErr       = utils.throwErr(callback);

  merge(safeConditions, conditions);

  if (!!this._path._schema.options.setChild) {
    if (!childPath) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    var childConditions = {};
    childConditions[childPath.name] = parent._id;
    merge(safeConditions, childConditions);
  }

  merge(safeConditions, { _id: { $in: parent[self._path] } });

  var query = childModel.find(safeConditions, options).select(fields);

  callback && query.exec(callback);
  return query;
};

// XXX: Does not save parent
HasAndBelongsToMany.prototype.delete = function (id, callback) {
  var self       = this._path,
      parent     = self._parent,
      childModel = modelFor(this._childModelName);
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
  MongooseArray.prototype._remove.call(self, id);

  // TODO: shold habtm support delete and destroy?
  if (!!~['delete', 'destroy', 'nullify'].indexOf(this._options.dependent)){
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

HasAndBelongsToMany.prototype.populate = function(fields, callback){
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var self     = this._path,
      parent   = self._parent,
      model    = parent.constructor,
      path     = self._path;
      throwErr = utils.throwErr(callback);

  // TODO: do we really need to initialize a new doc?
  return model.findById(parent._id).populate(path, fields).exec(callback);
};

// privates

var childIsAllowed = function (child) { return !!~this._allowed_discriminators.indexOf(child.constructor.modelName); };

var modelFor = function (discriminator) { return mongoose.model(discriminator); }

/* Create a child document and add it to the parent `Array`
*
* @param {Object|Array} objs [object(s) to create]
* @param {Functions} callback [passed: (err, parent, created children)]
* @api public
*/
MongooseArray.prototype.create = function (objs, callback) {
  return (new HasAndBelongsToMany(this)).create(objs, callback);
};

/* Find children documents
*
* *This is a copy of Model.find w/ added error throwing and such*
*/
MongooseArray.prototype.find = function (conditions, fields, options, callback) {
  return (new HasAndBelongsToMany(this)).find(conditions, fields, options, callback);
};

/* Syntactic sugar to populate the array
*
* @param {Array} fields
* @param {Function} callback
* @return {Query}
* @api public
*/
MongooseArray.prototype.populate = function (fields, callback) {
  return (new HasAndBelongsToMany(this)).populate(fields, callback);
}

/* Append an already instantiated document saves it in the process.
*
* @param {Document} child
* @param {Function} callback
* @api public
*/
MongooseArray.prototype.append = function (child, callback) {
  return (new HasAndBelongsToMany(this)).append(child, callback);
};

/* Append many instantiated children documents
*
* @param {Array} children
* @param {Function} callback
* @api public
*/
MongooseArray.prototype._concat = MongooseArray.prototype.concat;
MongooseArray.prototype.concat = function (children, callback) {
  return (new HasAndBelongsToMany(this)).concat(children, callback);
};

/* Overrides MongooseArray.remove only for dependent:destroy relationships
*
* @param {ObjectId} id
* @param {Function} callback
* @return {ObjectId}
* @api public
*/
MongooseArray.prototype._remove = MongooseArray.prototype.remove;
MongooseArray.prototype.remove = MongooseArray.prototype.delete = function (id, callback) {
  return (new HasAndBelongsToMany(this)).delete(id, callback);
};
