'use strict';

var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId
  , MongooseArray = mongoose.Types.Array
  , i = require('i')()
  , utils = require('./utils')
  , merge  = utils.merge;

module.exports = function hasAndBelongsToMany (schema, model, options) {
  let modelName = i.classify(model);
  let path = { };
  path[model] = [{ type: mongoose.Schema.ObjectId, ref: modelName }];
  schema.add(path);
  schema.paths[model].options.siblingPathName = options.inverseOf;
};

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

/* Append many instantiated children documents
*
* @param {Array} children
* @param {Function} callback
* @api public
*/
//base._concat = Array.prototype.concat;
//base.concat = function (docs, callback) {
  //var throwErr = utils.throwErr(callback);

  //if (!Array.isArray(docs)){
    //return throwErr('First argument needs to be an Array');
  //};

  //var complete = function(err, docs) {
    //if(err){ return throwErr(err) }

    //var ids = docs.map(function (doc) { return doc._id });
    //this._concat(ids);
    //this._markModified();

    //callback(null, docs);
  //}.bind(this);

  //var count = docs.length;
  //var savedDocs = [];
  //docs.forEach(function(doc){
    //this.append(doc);
    //doc.save(function(err, doc){
      //if(err) return complete(err);

      //savedDocs.push(doc);
      //--count || complete(null, savedDocs);
    //});
  //}.bind(this));

//};

/* Syntactic sugar to populate the array
*
* @param {Array} fields
* @param {Function} callback
* @return {Query}
* @api public
*/
//base.populate = function (fields, callback) {
  //if ('function' == typeof fields) {
    //callback = fields;
    //fields = null;
  //}

  //// TODO: do we really need to initialize a new doc?
  //return this._parent.constructor
    //.findById(this._parent._id)
    //.populate(this._path, fields)
    //.exec(callback);
//};

/* Overrides MongooseArray.remove only for dependent:destroy relationships
*
* @param {ObjectId} id
* @param {Function} callback
* @return {ObjectId}
* @api public
*/
//base._remove = base.remove;
//base.remove = base.delete = function (id, callback) {
  //var parent     = this._parent,
      //childModel = mongoose.model(this._schema.options.relationshipModel);
      //childPath  = this._childToParent;
      //child      = null,
      //throwErr   = utils.throwErr(callback);

  //if (id._id) {
    //var child = id;
    //id = child._id;
  //}

  //// TODO: should a callback be required?
  //if (!callback) {
    //callback = function (err) {
      //if (err) {
        //throw err;
      //}
    //};
  //}

  //var hasOrFetchChild = function(done){
    //if(child){
      //done(null, child);
    //} else {
      //childModel.findById(id, done);
    //};
  //};

  //// TODO: is this needed?
  //// I think this removing the id from the instance array
  //// however, it could be not needed
  //this._remove(id);

  //// TODO: shold habtm support delete and destroy?
  //if (!!~['delete', 'destroy', 'nullify'].indexOf(this._schema.options.dependent)){
    //hasOrFetchChild(function(err, child){
      //if (err) { return throwErr(err) };
      //child[childPath.name].remove(parent._id);
      //child.save(function(err, child){
        //if (err){ return throwErr(err) };
        //callback(null, parent);
      //});
    //});
  //} else {
    //callback(null, parent);
  //}
//};
