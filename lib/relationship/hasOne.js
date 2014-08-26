var Base = require('./base');

function hasOne (path) {
  this.path = path;
}

hasOne.prototype.__proto__ = Base;

module.exports = hasOne;
