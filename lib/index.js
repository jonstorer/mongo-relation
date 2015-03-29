var mongoose            = require('mongoose'),
    Schema              = mongoose.Schema,
    belongsTo           = require('./casts/belongsTo'),
    hasAndBelongsToMany = require('./casts/hasAndBelongsToMany'),
    hasMany             = require('./casts/hasMany');

Schema.prototype.belongsTo = function (model, options) {
  belongsTo(this, model, options);
};

Schema.prototype.hasMany = function (model, options) {
  hasMany(this, model, options);
};

Schema.prototype.habtm = function (model, options) {
  hasAndBelongsToMany(this, model, options);
};

Schema.prototype.hasAndBelongsToMany = Schema.prototype.habtm;
