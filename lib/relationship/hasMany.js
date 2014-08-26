var Base          = require('./base'),
    merge         = require('../utils').merge,
    MongooseArray = require('mongoose').Types.Array;

function hasMany (path) {
  this.path = path;
}

hasMany.prototype.__proto__ = Base;

hasMany.prototype.build = function (objs) {
  var self                    = this.path,
      parent                  = self._parent,
      setParent               = self._schema.options.setParent,
      childModelName          = self._schema.options.relationshipModel,
      childModel              = parent.model(childModelName),
      childSchema             = childModel.schema,
      parentModelName         = parent.constructor.modelName,
      childPath               = childSchema._findPathReferencing(parentModelName);

  var build = function (obj) {
    obj = new childModel(obj);
    obj[childPath.name] = parent;
    if (setParent) { parent[self._path].push(obj); }
    return obj;
  };

  if (Array.isArray(objs)) {
    return objs.map(function (obj) { return build(obj); });
  } else {
    return build(objs);
  }
};

hasMany.prototype.create = function (objs, callback) {
  var self            = this.path,
      parent          = self._parent,
      childModelName  = self._schema.options.relationshipModel,
      childModel      = parent.model(childModelName),
      childSchema     = childModel.schema,
      parentModelName = parent.constructor.modelName,
      childPath       = childSchema._findPathReferencing(parentModelName);

  var throwErr = this.errorThrower(callback);

  // You *need* a reference in the child `Document`
  if (!childPath)
    return throwErr('Parent model not referenced anywhere in the Child Schema');

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

hasMany.prototype.append = function (child, callback) {
  var throwErr = this.errorThrower(callback);

  var self         = this.path,
      parent       = self._parent,
      setParent    = self._schema.options.setParent,
      setChild     = self._schema.options.setChild,
      relationship = this.getRelationship();

  if (child.constructor.modelName !== relationship.ref) {
    return throwErr('Wrong Model type');
  }

  var childPath = child.schema._findPathReferencing(parent.constructor.modelName);
  child[childPath.name] = parent._id;

  // TODO: in a hasMany relationship
  // the parent should not hold child ids
  if(setParent){ parent[self._path].push(child._id); }

  if (!callback) {
    return child;
  } else {
    child.save(callback);
  }
};

hasMany.prototype.concat = function (children, callback) {
  var throwErr = this.errorThrower(callback);

  if (!Array.isArray(children))
    return throwErr('First argument needs to be an Array');

  var self        = this.path,
      setParent   = self._schema.options.setParent,
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
        if (setParent){
          MongooseArray.prototype._concat.call(self, childrenIds);
        }
        self._markModified();
        callback(null, children);
      }();
    });
  });
};

hasMany.prototype.find = function (conditions, fields, options, callback) {
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

  var self            = this.path,
      setParent       = self._schema.options.setParent,
      setChild        = self._schema.options.setChild,
      parent          = self._parent,
      childModel      = parent.model(self._schema.options.relationshipModel),
      childPath       = childModel.schema._findPathReferencing(parent.constructor.modelName),
      safeConditions  = {},
      childConditions = {};

  if (!childPath){
    return throwErr('Parent model not referenced anywhere in the Child Schema');
  }

  merge(safeConditions, conditions);

  childConditions[childPath.name] = parent._id;
  merge(safeConditions, childConditions);

  if(setParent) {
    merge(safeConditions, { _id: { $in: parent[self._path] } });
  }

  var query = childModel.find(safeConditions, options).select(fields);

  if ('undefined' === typeof callback) {
    return query;
  } else {
    query.exec(callback);
  }
};

hasMany.prototype.delete = function (id, callback) {
  var throwErr = this.errorThrower(callback);

  var self         = this.path,
      parent       = self._parent,
      setParent    = self._schema.options.setParent,
      relationship = this.getRelationship();
      childModel   = parent.model(relationship.ref),
      child        = null;

  if (id._id) {
    var child = id;
    id = child._id;
  }

  if (setParent) {
    MongooseArray.prototype._remove.call(self, id);
  }

  // TODO: should a callback be required?
  if (!callback) {
    callback = function (err) {
      if (err) {
        throw err;
      }
    };
  }

  if (!!~['delete', 'destroy'].indexOf(relationship.options.dependent)){
    childModel.remove({ _id: id }, function (err) {
      if (err) { return callback(err); }
      if (setParent) {
        parent.save(callback);
      } else {
        callback(null, parent);
      }
    });
  } else if (relationship.options.dependent === 'nullify') {

    var hasOrFetchChild = function(done){
      if(child){
        done(null, child);
      } else {
        childModel.findById(id, done);
      };
    };

    hasOrFetchChild( function(err, child) {
      if (err) { return callback(err) };
      var childPath = child.schema._findPathReferencing(parent.constructor.modelName);
      child.set(childPath.name, null);
      child.save(function (err, child) {
        if (err) {
          callback(err);
        } else {
          if (setParent) {
            parent.save(callback);
          } else {
            callback(null, parent);
          }
        }
      });
    });
  } else {
    callback(null, parent);
  }
};

hasMany.prototype.populate = function (fields, callback) {
  if ('function' == typeof fields) {
    callback = fields;
    fields = null;
  }

  var throwErr = this.errorThrower(callback);

  var self      = this.path,
      setParent = self._schema.options.setParent,
      parent    = self._parent,
      model     = parent.constructor,
      path      = self._path;

  if(!setParent) {
    return throwErr('Cannot populate when setParent is false. Use #find.');
  }

  // TODO: do we really need to initialize a new doc?
  model.findById(parent._id).populate(path, fields).exec(callback);
};

module.exports = hasMany;
