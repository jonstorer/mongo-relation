var util     = require('util')
  , mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , defaultOptions;

defaultOptions = {
  name: { type: String, required: true, trim: true }
}

function PetSchemaBase() {
  var opts = {};
  opts = util._extend(opts, defaultOptions);
  opts = util._extend(opts, arguments[0]);
  arguments[0] = opts;

  Schema.apply(this, arguments);

  this.habtm('twitter_users', { setParent: false });
  this.belongsTo('category');
}
util.inherits(PetSchemaBase, Schema);

module.exports = PetSchemaBase;
