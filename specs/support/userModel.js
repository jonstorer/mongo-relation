var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({ name: String });

//userSchema.hasOne('Post', { through: 'post' });

//userSchema.hasMany('Address', { setParent: false, dependent: 'nullify' });
//userSchema.hasMany('Category', { through: 'categories' });
//userSchema.hasMany('Location', { as: 'locateable', setParent: false, through: 'locations' });
//userSchema.hasMany('Notification', { setParent: false, dependent: 'delete'  });
//userSchema.hasMany('Tag', { dependent: 'nullify' });
userSchema.hasMany('Tweet', { dependent: 'delete', inverse_of: 'author' });

//userSchema.habtm('Pet', { setParent: false })

module.exports = mongoose.model('User', userSchema);
