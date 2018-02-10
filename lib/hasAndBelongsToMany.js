'use strict';

let mongoose = require('mongoose');
let i = require('i')();

module.exports = function hasAndBelongsToMany (schema, model, options) {
  let modelName = i.classify(model);
  let path = { };
  path[model] = [{ type: mongoose.Schema.ObjectId, ref: modelName }];
  schema.add(path);
  schema.paths[model].options.siblingPathName = options.inverseOf;
};
