var mongoose = require('mongoose');

var twitterUserSchema = new mongoose.Schema({ name: String });

twitterUserSchema.hasMany('categories');
twitterUserSchema.hasMany('tags', { dependent: 'nullify' });
twitterUserSchema.hasMany('tweets', { dependent: 'delete', inverse_of: 'author' });

twitterUserSchema.habtm('pets', { setParent: false })

module.exports = mongoose.model('TwitterUser', twitterUserSchema);
