var Base = require('./base');

function belongsTo (path) {
  this.path = path;
}

belongsTo.prototype.__proto__ = Base;

module.exports = belongsTo;
