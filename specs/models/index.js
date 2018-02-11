let mongoose = require('mongoose');
let uuid = require('node-uuid');

const User = require('./user')(mongoose);
const Note = require('./note')(mongoose);
const Identity = require('./identity')(mongoose);
const SocialIdentity = require('./social_identity')(mongoose, Identity);
const EmailIdentity = require('./email_identity')(mongoose, Identity);
const PhoneIdentity = require('./phone_identity')(mongoose, Identity);
const Membership = require('./membership')(mongoose);
const Account = require('./account')(mongoose, uuid);
const Subscription = require('./subscription')(mongoose);
const Plan = require('./plan')(mongoose);
const BenefitBundle = require('./benefit_bundle')(mongoose);
const BenefitBundlePrice = require('./benefit_bundle_price')(mongoose);
const Benefit = require('./benefit')(mongoose);
