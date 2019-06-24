
module.exports = function (mongoose, i) {
  return function (associationName, options) {
    let path = {};

    path[associationName] = {
      type: mongoose.Schema.ObjectId,
      ref: i.classify(associationName)
    }

    this.add(path);
  };
};
