'use strict';

module.exports = function (mongoose, i) {

  return function hasAndBelongsToMany (model, options) {
    let modelName = i.classify(model);
    let path = { };
    path[model] = [{ type: mongoose.Schema.ObjectId, ref: modelName }];
    this.add(path);
    this.paths[model].options.siblingPathName = options.inverseOf;
  };

};
