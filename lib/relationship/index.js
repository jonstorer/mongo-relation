var types = {
  hasMany: require('./hasMany'),
  habtm: require('./hasAndBelongsToMany')
}

function Relationship (path) {
  var relationshipType = path._schema.options.relationshipType;
  return new types[relationshipType](path);
}

module.exports = Relationship;
