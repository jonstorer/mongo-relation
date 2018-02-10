let mongoose = require('mongoose');
let uuid = require('node-uuid');

module.exports.User = require('./user')(mongoose);
module.exports.Membership = require('./membership')(mongoose);
module.exports.Account = require('./account')(mongoose, uuid);
module.exports.Subscription = require('./subscription')(mongoose);
module.exports.Plan = require('./plan')(mongoose);
module.exports.Benefit = require('./benefit')(mongoose);
