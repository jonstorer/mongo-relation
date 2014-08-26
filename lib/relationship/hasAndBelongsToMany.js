var Base          = require('./base'),
    merge         = require('../utils').merge,
    MongooseArray = require('mongoose').Types.Array;

function hasAndBelongsToMany (path) {
  this.type = 'habtm';
  this.path = path;
}

hasAndBelongsToMany.prototype.__proto__ = Base;

hasAndBelongsToMany.prototype.shouldSetChild = function () {
  return this.path._schema.options.setChild;
};

hasAndBelongsToMany.prototype.build = function(objs){
  var rel        = this,
      self       = this.path,
      parent     = self._parent,
      childModel = this.getChildModel();
      childPath  = this.getInverse();

  var build = function (obj) {
    var child = new childModel(obj);

    if (rel.shouldSetChild()) {
      child[childPath.name].push(parent);
    }

    parent[self._path].push(child);
    return child;
  };

  if (Array.isArray(objs)) {
    return objs.map(function (obj) { return build(obj); });
  } else {
    return build(objs);
  }
};

hasAndBelongsToMany.prototype.append = function(child, callback){
  var throwErr = this.errorThrower(callback);

  var self         = this.path,
      parent       = self._parent,
      relationship = this.getRelationship(),
      childPath    = this.getInverse();

  if (child.constructor.modelName !== relationship.ref) {
    return throwErr('Wrong Model type');
  }

  if (this.shouldSetChild()) {
    child[childPath.name].push(parent._id);
  }

  parent[self._path].push(child._id);

  if (!callback) {
    return child;
  } else {
    child.save(callback);
  }

};

hasAndBelongsToMany.prototype.find = function(conditions, fields, options, callback){
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

  var throwErr = this.errorThrower(callback);

  var self           = this.path,
      parent         = self._parent,
      childModel     = this.getChildModel();
      childPath      = this.getInverse(),
      safeConditions = {};

  merge(safeConditions, conditions);

  if (this.shouldSetChild()) {
    if (!childPath) {
      return throwErr('Parent model not referenced anywhere in the Child Schema');
    }

    var childConditions = {};
    childConditions[childPath.name] = parent._id;
    merge(safeConditions, childConditions);
  }

  merge(safeConditions, { _id: { $in: parent[self._path] } });

  var query = childModel.find(safeConditions, options).select(fields);

  if (callback) {
    query.exec(callback);
  } else {
    return query;
  }
};

hasAndBelongsToMany.prototype.populate = function(fields, callback){
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var throwErr = this.errorThrower(callback);

  var self   = this.path,
      parent = self._parent,
      model  = parent.constructor,
      path   = self._path;

  return model.findById(parent._id).populate(path, fields).exec(callback);
};

hasAndBelongsToMany.prototype.create = function (objs, callback) {
  var self            = this.path,
      parent          = self._parent,
      childModel      = this.getChildModel();
      childSchema     = childModel.schema,
      parentModelName = parent.constructor.modelName,
      childPath       = this.getInverse();

  // You *need* a reference in the child `Document`
  if (this.shouldSetChild())
    if (!childPath)
      throw new Error('Parent model not referenced anywhere in the Child Schema');

  // If we're provided an `Array`, we need to iterate
  objs = this.build(objs);

  if (Array.isArray(objs)) {
    var created = [],
        total   = objs.length;

    objs.forEach(function (obj, i) {
      obj.save(function (err, obj) {
        if (err) {
          // Empty the array and return the error,
          // effectively breaking the loop.
          objs.splice(i, objs.length - i);
          return callback(err);
        }
        // Store the created records;
        created.push(obj);
        --total || parent.save(function (err, parent) {
          if (err)
            return callback(err);
          return callback(null, parent, created);
        });
      });
    });
  } else {
    // Only one object needs creation.
    // Going for it then!
    objs.save(function (err, obj) {
      if (err)
        return callback(err);
      parent.save(function (err, parent) {
        if (err)
          return callback(err);
        return callback(null, parent, obj);
      });
    });
  }
};

hasAndBelongsToMany.prototype.concat = function(children, callback){
  var throwErr = this.errorThrower(callback);

  if (!Array.isArray(children))
    return throwErr('First argument needs to be an Array');


  var self        = this.path,
      children    = children.map(function (child) { return self.append(child); }),
      childrenIds = children.map(function (child) { return child._id; }),
      total       = children.length;

  children.forEach(function (child) {
    child.save(function (err, child) {
      if (err) {
        // Empty the array and return the error,
        // effectively breaking the loop.
        objs.splice(i, objs.length - i);
        return callback(err);
      }

      --total || function () {
        // TODO: is this needed?
        // I think this is updating the instance of the array
        // while #append is updating the document
        // but this could be unnecessary
        MongooseArray.prototype._concat.call(self, childrenIds);
        self._markModified();
        callback(null, children);
      }();

    });
  });
};

// XXX: Does not save parent
hasAndBelongsToMany.prototype.delete = function (id, callback) {
  var throwErr = this.errorThrower(callback);

  var rel          = this,
      self         = this.path,
      parent       = self._parent,
      relationship = this.getRelationship();
      childModel   = this.getChildModel();
      child        = null;

  if (id._id) {
    var child = id;
    id = child._id;
  }

  // TODO: is this needed?
  // I think this removing the id from the instance array
  // however, it could be not needed
  MongooseArray.prototype._remove.call(self, id);

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

  if (!!~['delete', 'destroy', 'nullify'].indexOf(relationship.options.dependent)){
    hasOrFetchChild(function(err, child){
      if (err) { return callback(err) };
      var childPath       = rel.getInverse();
      child[childPath.name].remove(parent._id);
      child.save(function(err, child){
        if (err){
          callback(err);
        } else {
          callback(null, parent);
        }
      });
    });
  } else {
    callback(null, parent);
  }
};

module.exports = hasAndBelongsToMany;
