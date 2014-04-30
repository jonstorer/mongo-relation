var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({});

UserSchema.hasMany('Tweet', { through: 'tweets' });

module.exports = mongoose.model('User', UserSchema);
