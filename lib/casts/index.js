var types = {
  hasMany:   require('./hasMany'),
  belongsTo: require('./belongsTo'),
  hasOne:    require('./hasOne'),
  habtm:     require('./hasAndBelongsToMany')
}

module.exports = types;
