'use strict';

const mongoose = require('./');;
const should = require('should');
const uuid = require('node-uuid');

describe('belongsTo', function() {
  let membershipSchema, Membership,
      userSchema, User,
      accountSchema, Account;

  before(function() {
    Membership = mongoose.model('Membership');
    membershipSchema = Membership.schema;

    Account = mongoose.model('Account');
    accountSchema = Account.schema;

    User = mongoose.model('User');
    userSchema = User.schema;
  });

  it('creates a path for widget on the schema', function() {
    should(membershipSchema.paths.user).exist;
    should(membershipSchema.paths.account).exist;
  });

  it('sets the relationship type', function() {
    should(membershipSchema.paths.user.options.relationshipType).equal('belongsTo');
    should(membershipSchema.paths.account.options.relationshipType).equal('belongsTo');
  });

  it('sets the instance', function() {
    should(membershipSchema.paths.user.instance).equal('ObjectID');
    should(membershipSchema.paths.account.instance).equal('ObjectID');
  });

  it('sets the ref', function() {
    should(membershipSchema.paths.user.options.ref).equal('User');
    should(membershipSchema.paths.account.options.ref).equal('Account');
  });

  it('can set required', function() {
    should(membershipSchema.paths.user.isRequired).eql(true);
    should(membershipSchema.paths.account.isRequired).eql(false);
  });

  describe('options', function() {
    let path;

    describe('custom name', function() {
      before(function() {
        path = mongoose.model('BenefitBundlePrice').schema.paths.availability_zone;
      });

      it('sets the custom named path', function() {
        should(path).not.equal(undefined);
      });

      it('sets ref to the passed in modelName', function() {
        should(path.options.ref).equal('ServiceArea');
      });
    });

    describe('required', function() {
      let path;

      before(function() {
        path = mongoose.model('BenefitBundlePrice').schema.paths.plan;
      });

      it('passes through the required field', function() {
        should(path.isRequired).be.true;
      });
    });

    describe('polymorphic', function() {
      let subject_type, subject_id;

      before(function() {
        subject_type = mongoose.model('Note').schema.paths.noteable_type;
        subject_id = mongoose.model('Note').schema.paths.noteable;
      });

      describe('ObjectID half', function() {
        it('exists', function() {
          should(subject_id).exist;
        });

        it('sets the id property', function() {
          should(subject_id.instance).equal('ObjectID');
        });

        it('knows it is a part of a polymorphic relationship', function() {
          should(subject_id.options.polymorphic).be.true;
        });

        it('passes through options', function() {
          should(subject_id.isRequired).eql(true);
        });
      });

      describe('Type half', function() {
        it('creates the type path', function() {
          should(subject_type).not.eql(undefined);
        });

        it('sets the type as String', function() {
          should(subject_type.instance).equal('String');
        });

        it('passes through options', function() {
          should(subject_type.isRequired).eql(true);
        });
      });

      describe('enum', function() {
        it('applies the provided enum to the _type path', function() {
          should(subject_type.enumValues).containDeepOrdered([ 'User', 'Account' ]);
        });
      });

      describe('setting required to true', function() {
        it('sets required on the id to true', function() {
          should(subject_id.isRequired).eql(true);
        });

        it('sets required on the type to true', function() {
          should(subject_type.isRequired).eql(true);
        });
      });
    });

    describe('touch:true', function() {
      let membership, userVersion, accountVersion;

      before(function() {
        let User = mongoose.model('User');
        let Membership = mongoose.model('Membership');
        let Account = mongoose.model('Account');

        return Promise.all([
          User.create({}),
          Account.create({})
        ]).then(function (values) {
          return Membership.create({
            user: values[0],
            account: values[1]
          });
        }).then(function (_membership) {
          membership = _membership;
          userVersion = membership.user.__v;
          accountVersion = membership.account.__v;
        });
      });

      it('touches the parent document before save', function() {
        return membership.save().then(function(){
          return Membership.findById(membership._id).populate('user account');
        }).then(function(membership){
          should(membership.user.__v).not.eql(userVersion);
          should(membership.account.__v).eql(accountVersion);
        });
      });
    });
  });
});
