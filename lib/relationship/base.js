function Base (path) {
  this.path = path;
}

Base.findPathReferencing = function (modelName, type) {
  var self = this.path;

  for (var path in self.paths) {
    var options = self.paths[path].options;
    if (type) {
      if (options[type] && options[type] === modelName) {
        return {
          type: type,
          name: path
        };
        break;
      }
    } else if (options.belongsTo === modelName || options.habtm === modelName) {
      var type = Array.isArray(options.type) ? 'habtm' : 'belongsTo';
      return {
        type: type,
        name: path
      };
      break;
    }
  }
};

Base._hasRelationship = function () {
  var self = this.path;
  return self._schema && (self._schema.options.hasMany || self._schema.options.habtm || self._schema.options.hasOne);
};

module.exports = Base;
