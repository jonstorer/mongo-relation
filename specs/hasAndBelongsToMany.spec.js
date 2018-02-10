'use strict';

require('./spec_helper');

const mongoose = require('mongoose');
const should = require('should');

describe('hasManyBelongsToMany', function() {
  let User, Address, tagSchema;

  before(function () {
    let userSchema = new mongoose.Schema({});
    userSchema.hasAndBelongsToMany('addresses', { inverseOf: 'users' });
    User = mongoose.model('User_', userSchema);

    let addressSchema = new mongoose.Schema({
      city: { type: String },
      state: { type: String }
    });
    addressSchema.hasAndBelongsToMany('users', { inverseOf: 'addresses' });
    Address = mongoose.model('Address', addressSchema);

    tagSchema = new mongoose.Schema({});
  });

  describe('inverseOf not set', function () {
    it('does not add origin sibling to other sibling');
  });

  describe('with descriminators', function () {
    it('sets & finds the correct children');
  });

  describe('dependent:nullify', function () {
    it('removes relationship from parent, nulls relationship on child');
  });

  describe('dependent:nullify', function () {
    it('removes relationship from parent, destroys child');
  });

  describe('#deleteOne', function () {
    it('deletesOne from the database');
  });

  describe('#deleteMany', function () {
    it('deletesMany from the database');
  });

  describe('#build', function(){
    let user, address;

    before(function () {
      user = new User();
      address = user.addresses.build({});
    });

    it('builds an instance of Address', function(){
      should(address).be.an.instanceof(Address);
    });

    it('adds the user relationship to address', function(){
      should(address.users).containEql(user._id);
      should(address.users).have.length(1);
    });

    it('adds the address relationship to user', function(){
      should(user.addresses).containEql(address._id);
      should(user.addresses).have.length(1);
    });
  });

  describe('#append', function () {
    let user, address;

    before(function (done) {
      user = new User();
      address = new Address();
      user.save(done);
    });

    it('appends an instantiated child document', function(done) {
      should(user.isNew).eql(false);
      should(address.isNew).eql(true);

      user.addresses.append(address, function (err, address) {
        should.strictEqual(err, null);

        should(user.addresses).containEql(address._id);
        should(address.users).containEql(user._id);

        should(user.isNew).eql(false);
        should(address.isNew).eql(false);

        done();
      });
    });
  });

  describe('#create', function () {
    let user;

    beforeEach(function (done) {
      user = new User();
      user.save(done);
    });

    it('creates one child document', function(done) {
      user.addresses.create({}, function(err, address){
        should.strictEqual(err, null);

        should(address).be.an.instanceOf(Address);

        should(user.addresses).have.length(1);
        should(user.addresses).containEql(address._id);

        should(address.users).have.length(1);
        should(address.users).containEql(user._id);

        done();
      });
    });

    it('creates many child documents', function(done) {
      user.addresses.create([{}, {}], function(err, addresses){
        should.strictEqual(err, null);

        should(addresses).be.an.instanceOf(Array);
        should(addresses[0]).be.an.instanceOf(Address);
        should(addresses[1]).be.an.instanceOf(Address);

        should(user.addresses).have.length(2);
        should(user.addresses).containEql(addresses[0]._id);
        should(user.addresses).containEql(addresses[1]._id);

        should(addresses[0].users).have.length(1);
        should(addresses[0].users).containEql(user._id);

        should(addresses[1].users).have.length(1);
        should(addresses[1].users).containEql(user._id);

        done();
      });
    });
  });

  describe('#find', function () {
    let address1, address2, user;

    before(function (done) {
      User.create({}, function (err1, _user) {
        user = _user;
        user.addresses.create({ city: 'NYC', state: 'NY' }, function (err2, _address) {
          address1 = _address;
          user.addresses.create({ city: 'CHI', state: 'IL' }, function (err3, _address) {
            address2 = _address;
            done(err1 || err2 || err3);
          });
        });
      });
    });

    describe('the query', function () {
      it('searchs the correct model', function(){
        let query = user.addresses.find({});
        should(query.model.modelName).eql('Address');
      });

      it('creates the correct default query', function(){
        let query = user.addresses.find();
        should(query._conditions._id).have.property('$in');
        should(query._conditions._id['$in']).containEql(address1._id, address2._id);
      });

      it('creates the correct query with conditions', function(){
        let query = user.addresses.find({ name: 'NYC' });

        should(query._conditions).have.property('name');
        should(query._conditions.name).eql('NYC');
      });

      it('creates the correct query with fields', function(){
        let query = user.addresses.find({ name: 'NYC' }, 'city state');

        should(query._fields).have.property('city');
        should(query._fields.city).eql(1);

        should(query._fields).have.property('state');
        should(query._fields.state).eql(1);
      });

      it('creates the correct query with options', function(){
        let query = user.addresses.find({ city: 'NYC' }, 'city', { skip: 10 });

        should(query.options).have.property('skip');
        should(query.options.skip).eql(10);
      });

      it('returns the query when a callback is passed in', function(){
        let query = user.addresses.find({ city: 'NYC' }, 'city', { skip: 10 }, function () {});

        should(query).be.an.instanceOf(mongoose.Query);
      });
    });

    describe('executing', function () {
      it('sends results to the callback', function(done){
        user.addresses.find({}, null, null, function (err, docs) {
          should(docs).have.length(2);
          should(docs[0].id).eql(address1.id);
          should(docs[1].id).eql(address2.id);
          done();
        });
      });

      it('supports a callback with no options', function(done){
        user.addresses.find({}, null, function (err, docs) {
          should(docs).have.length(2);
          should(docs[0].id).eql(address1.id);
          should(docs[1].id).eql(address2.id);
          done();
        });
      });

      it('supports a callback with no options and no fields', function(done){
        user.addresses.find({}, function (err, docs) {
          should(docs).have.length(2);
          should(docs[0].id).eql(address1.id);
          should(docs[1].id).eql(address2.id);
          done();
        });
      });

      it('supports a callback with no options and no fields and no conditions', function(done){
        user.addresses.find(function (err, docs) {
          should(docs).have.length(2);
          should(docs[0].id).eql(address1.id);
          should(docs[1].id).eql(address2.id);
          done();
        });
      });
    });
  });

  describe('#remove', function(){
    let address1, address2, user;

    before(function (done) {
      User.create({}, function (err1, _user) {
        user = _user;
        user.addresses.create({ city: 'NYC', state: 'NY' }, function (err2, _address) {
          address1 = _address;
          user.addresses.create({ city: 'CHI', state: 'IL' }, function (err3, _address) {
            address2 = _address;
            done(err1 || err2 || err3);
          });
        });
      });
    });

    it('removes a sibling document', function(done) {
      should(user.addresses).have.length(2);
      should(user.addresses).containEql(address2._id);

      let address2_id = address2.id;

      user.addresses.remove({ city: 'CHI' }, function(err, results, docs){
        should(err).be.null();

        should(results.ok).be.eql(1);
        should(results.n).be.eql(1);

        should(docs).have.length(1)
        should(docs[0].id).eql(address2_id);

        should(user.addresses).have.length(1);
        should(user.addresses).not.containEql(address2._id);

        Address.findById(address2_id, function (err, address) {
          should(err).be.null();
          should(address).be.null();
          done();
        });
      });
    });
  });
});
