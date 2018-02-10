'use strict';

module.exports = function (mongoose) {

  let MongooseArray = mongoose.Types.Array
  // mongoose > 3.9.x support
  let self = MongooseArray.mixin || MongooseArray.prototype;

  self.build = function (object) {
    let Model = mongoose.model(this._schema.caster.options.ref);
    let child = new Model(object);

    this._parent[this._schema.path].push(child._id);
    child[this._schema.options.siblingPathName].push(this._parent._id);

    return child;
  };

  self.append = function (child, callback) {
    this._parent[this._schema.path].push(child._id);
    child[this._schema.options.siblingPathName].push(this._parent._id);

    let count = 2;

    child.save(function (err) {
      if (err) { return callback(err); }
      --count || callback(err, child)
    });

    this._parent.save(function (err) {
      if (err) { return callback(err); }
      --count || callback(err, child)
    });
  };

  self.create = function (objects, callback) {
    let complete = function (err, docs) {
      if (err) {
        callback(err);
      } else {
        this._parent.save(function (err) {
          if(err) {
            callback(err)
          } else {
            callback(null, docs);
          }
        });
      }
    }.bind(this);

    if (Array.isArray(objects)) {
      let docs = [];
      let count = objects.length;

      objects.forEach(function (object) {
        this.build(object).save(function (err, doc) {
          if (err) {
            complete(err);
          } else {
            docs.push(doc);
            --count || complete(null, docs);
          }
        });
      }.bind(this));
    } else {
      this.build(objects).save(complete);
    }
  };

  self.find = function (conditions, fields, options, callback) {
    if ('function' == typeof conditions) {
      callback = conditions;
      conditions = {};
      fields = null;
      options = null;
    }

    conditions = conditions || {};
    conditions['_id'] = { $in: this._parent[this._schema.path] };

    let Model = mongoose.model(this._schema.caster.options.ref);
    let query = Model.find(conditions, fields, options);


    callback && query.exec(callback);
    return query;
  };

  // remove is an alias for #pull
  self._remove = self.remove;
  self.remove = function (conditions, callback) {
    let Model = mongoose.model(this._schema.caster.options.ref);

    this.find(conditions, function (err, docs) {
      if (err) { return callback (err); }

      let ids = docs.map(function (doc) { return doc._id });
      let removeConditions = { _id: { $in: ids } };

      Model.remove(removeConditions, function (err, results) {
        if (err) { return callback (err); }

        this.pull(ids);
        this._parent.save(function (err) {
          if (err) { return callback (err); }

          callback(null, results, docs);
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

  return mongoose;
};
