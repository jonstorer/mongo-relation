var mongoose = require('mongoose');

var twitterPostSchema = new mongoose.Schema({
  title: String
});

twitterPostSchema.belongsTo('author', { modelName: 'TwitterUser' });

twitterPostSchema.habtm('categories');

module.exports = mongoose.model('TwitterPost', twitterPostSchema);
