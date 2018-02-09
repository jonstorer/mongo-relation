'use strict';

require('./spec_helper');

const mongoose = require('mongoose');
const should = require('should');

describe('hasManyBelongsToMany', function() {
  let User, Address, tagSchema;;

  before(function () {
    let userSchema = new mongoose.Schema({});
    userSchema.hasAndBelongsToMany('addresses', { inverseOf: 'users' });
    User = mongoose.model('User', userSchema);

    let addressSchema = new mongoose.Schema({
      city: { type: String },
      state: { type: String }
    });
    addressSchema.hasAndBelongsToMany('users', { inverseOf: 'addresses' });
    Address = mongoose.model('Address', addressSchema);

    tagSchema = new mongoose.Schema({});
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

    describe('inverseOf not set', function () {
      it('does not add parent to child');
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

















  //it("cannot set 'dependent:nullify' and 'setChild:false'", function(){
    //(function(){
      //BookSchema.habtm('Page', { setChild: false, dependent: 'nullify' });
    //}).should.throw("dependent cannot be set to 'nullify' while setChild is false")
  //});

  //it("cannot set 'dependent:destroy' and 'setChild:false'", function(){
    //(function(){
      //BookSchema.habtm('Page', { setChild: false, dependent: 'destroy' });
    //}).should.throw("dependent cannot be set to 'destroy' while setChild is false")
  //});

  //it('test presence of added methods to the MongooseArray', function() {
    //category.posts.populate.should.be.a.Function;
    //post.categories.populate.should.be.a.Function;

    //category.posts.remove.should.be.a.Function;
    //post.categories.remove.should.be.a.Function;

    //category.posts.concat.should.be.a.Function;
    //post.categories.concat.should.be.a.Function;
  //});


  //it('appends an instantiated child document', function(done) {
    //var category = new Category(),
        //post     = new TwitterPost();

    //category.posts.append(post, function(err, post){
      //should.strictEqual(err, null);

      //post.categories.should.containEql(category._id);
      //category.posts.should.containEql(post._id);

      //done();
    //});
  //});

  //it('concatenates many instantiated child documents', function(done) {
    //var category = new Category(),
        //posts    = [new TwitterPost(), new TwitterPost()];

    //category.posts.concat(posts, function(err, posts){
      //should.strictEqual(err, null);

      //var count = posts.length;
      //posts.forEach(function(post){
        //post.categories.should.containEql(category._id);
        //category.posts.should.containEql(post._id);
        //--count || done();
      //});
    //});
  //});

  //it('deletes dependent', function(done){
    //var category = new Category(),
        //posts    = [ { title: 'Blog post #1' },
                     //{ title: 'Blog post #2' } ]

    //category.posts.create(posts, function(err, category, posts){
      //var post = posts[0];

      //category.posts.remove(post._id, function(err, category){
        //should.strictEqual(err, null);

        //category.posts.should.not.containEql(post._id);
        //category.posts.should.have.length(1);

        //// TwitterPost, should still exist, this is HABTM
        //TwitterPost.findById(post._id, function(err, post){
          //should.strictEqual(err, null);

          //should.exist(post);

          //post.categories.should.not.containEql(category._id);
          //post.categories.should.have.length(0);

          //post.categories.create({}, function(err, post, category){

            //post.categories.remove(category._id, function(err, post){
              //should.strictEqual(err, null);

              //// Deletes the category reference in the post
              //post.categories.should.not.containEql(category._id);
              //post.categories.should.have.length(0);

              //// ... but shouldn't have in the category's post (no dependent: delete);
              //Category.findById(category._id, function(err, category){
                //should.strictEqual(err, null);

                //category.posts.should.containEql(post._id);
                //category.posts.should.have.length(1);

                //done();
              //});
            //});
          //});
        //});
      //});
    //});
  //});

  //it('populations of path', function(done){
    //var category = new Category(),
         //posts = [ { title: 'Blog post #1' },
                   //{ title: 'Blog post #2' } ];

    //category.posts.create(posts, function(err, category, posts){
      //category.save(function(err, category){
        //Category.findById(category._id).populate('posts').exec(function(err, populatedCategory){
          //should.strictEqual(err, null);

          //// Syntactic sugar
          //var testSugar = function(){
            //category.posts.populate(function(err, category){
              //should.strictEqual(err, null);

              //category.posts.forEach(function(post){
                //post.should.be.an.instanceof(TwitterPost);
              //});

              //done();
            //});
          //};

          //var count = populatedCategory.posts.length;
          //populatedCategory.posts.forEach(function(post){
            //post.should.be.an.instanceof(TwitterPost);
          //});
          //testSugar();
        //});
      //});
    //});
  //});

  //describe('setChild false', function(){
    //it('instantiates one child document', function(){
      //var tweet = new Tweet(),
          //tag = { name: 'Easy' };

      //var built = tweet.tags.build(tag);

      //built.should.be.an.instanceof(Tag);
      //tweet.tags.should.containEql(built._id);
      //should(tag.tweets).eql(undefined)
    //});

    //it('appends an instantiated child document', function(done) {
      //var tweet = new Tweet(),
          //tag   = new Tag();

      //tweet.tags.append(tag, function(err, tag){
        //should.strictEqual(err, null);
        //should(tag.tweets).eql(undefined);
        //tweet.tags.should.containEql(tag._id);
        //done();
      //});
    //});

    //it('concats many instantiated child documents', function(done) {
      //var tweet = new Tweet(),
          //tags  = [new Tag(), new Tag()];

      //tweet.tags.concat(tags, function(err, tags){
        //should.strictEqual(err, null);

        //var count = tags.length;
        //tags.forEach(function(tag){
          //should(tag.tweets).eql(undefined);
          //tweet.tags.should.containEql(tag._id);
          //--count || done();
        //});
      //});
    //});

    //it('creates one child document', function(done) {
      //var tweet = new Tweet({ author: new TwitterUser() }),
          //tag = { name: 'Easy' };

      //tweet.tags.create(tag, function(err, tweet, tag){
        //should.strictEqual(err, null);

        //tweet.should.be.an.instanceof(Tweet);
        //tweet.tags.should.have.length(1);
        //tweet.tags[0].should.equal(tag._id);

        //tag.should.be.an.instanceof(Tag);
        //tag.name.should.equal('Easy')
        //should(tag.tweets).eql(undefined);

        //done();
      //});
    //});

    //it('creates many child documents', function(done){
      //var tweet = new Tweet({ author: new TwitterUser()});
          //tags    = [ { name: 'Blog tag #1' },
                      //{ name: 'Blog tag #2' } ]

      //tweet.tags.create(tags, function(err, tweet, tags){
        //should.strictEqual(err, null);

        //tweet.tags.should.have.length(2);

        //tags.should.have.length(2);

        //var count = tags.length;
        //tags.forEach(function(tag){
          //tweet.tags.should.containEql(tag._id)
          //tag.should.be.an.instanceof(Tag);
          //should(tag.categories).eql(undefined);
          //--count || done();
        //});
      //});
    //});

    //it('finds children documents', function(done){
      //var tweet = new Tweet({ author: new TwitterUser()}),
          //tags  = [ { name: 'Blog tag #1' },
                    //{ name: 'Blog tag #2' } ]

      //tweet.tags.create(tags, function(err, tweet, tags){
        //should.strictEqual(err, null);

        //var find = tweet.tags.find({})

        //find.should.be.an.instanceof(mongoose.Query);
        //find._conditions.should.have.property('_id');
        //find._conditions.should.not.have.property('tags');
        //find._conditions._id['$in'].should.be.an.instanceof(Array);

        //find.exec(function(err, newTags){
          //should.strictEqual(err, null);

          //var testFind = function(){
            //find.find({name: 'Blog tag #1'}, function(err, otherTags){
              //find._conditions.name.should.equal('Blog tag #1');
              //find._conditions.should.have.property('_id');

              //otherTags.should.have.length(1);
              //otherTags[0].name.should.equal('Blog tag #1');

              //done();
            //});
          //};

          //var count = newTags.length;
          //newTags.should.have.length(2);
          //newTags.forEach(function(tag){
            //tweet.tags.should.containEql(tag._id)
            //tag.should.be.an.instanceof(Tag);
            //should(tag.categories).eql(undefined);
            //--count || testFind();
          //});
        //});
      //});
    //});

    //it('populations of path', function(done){
      //var tweet = new Tweet({ author: new TwitterUser() }),
           //tags = [ { name: 'Blog tag #1' },
                    //{ name: 'Blog tag #2' } ];

      //tweet.tags.create(tags, function(err, tweet, tags){
        //tweet.save(function(err, tweet){
          //Tweet.findById(tweet._id).populate('tags').exec(function(err, populatedTweet){
            //should.strictEqual(err, null);

            //// Syntactic sugar
            //var testSugar = function(){
              //tweet.tags.populate(function(err, tweet){
                //should.strictEqual(err, null);

                //var count = tweet.tags.length;
                //tweet.tags.forEach(function(tag){
                  //tag.should.be.an.instanceof(Tag);
                  //--count || done();
                //});
              //});
            //};

            //var count = populatedTweet.tags.length;
            //populatedTweet.tags.forEach(function(tag){
              //tag.should.be.an.instanceof(Tag);
              //--count || testSugar();
            //});
          //});
        //});
      //});
    //});
  //});
//});

//describe('with descriminators', function(){
  //var user, dog, fish;
  //beforeEach(function(done){
    //user = new TwitterUser();
    //dog  = new Dog({ name: 'Maddie', date_of_birth: new Date('12/24/2005'), breed: 'Border Collie Mix' });
    //fish = new Fish({ name: 'Dory', date_of_birth: new Date('5/30/2003') });
    //user.save(done);
  //});

  //context('associating', function(){
    //describe('#create', function(){
      //it('creates the superclass', function(done){
        //user.pets.create({}, function(err, user, pet){
          //should(pet.__t).eql.undefined;
          //pet.should.be.an.instanceof(Pet);
          //done();
        //});
      //});

      //it('creates a subclass', function(done){
        //user.pets.create(dog, function(err, user, cDog){
          //should.strictEqual(err, null);
          //should(dog._id).eql(cDog._id);
          //should(dog.__t).eql('Dog');
          //should(dog.__t).eql(cDog.__t);
          //done();
        //});
      //});
    //});

    //describe('#append', function(){
      //it('appends an instantiated child document', function(done) {
        //user.pets.append(fish, function(err, fish){
          //should.strictEqual(err, null);
          //user.pets.should.containEql(fish._id);
          //should(fish.__t).eql('Fish');
          //done();
        //});
      //});
    //});

    //describe('#concat', function(){
      //it('concats a hertogenious set of child documents', function(done) {
        //user.pets.concat([fish, dog], function(err, pets){
          //should.strictEqual(err, null);

          //user.pets.should.containEql(fish._id);
          //should(pets[0].__t).eql('Fish');

          //user.pets.should.containEql(dog._id);
          //should(pets[1].__t).eql('Dog');
          //done();
        //});
      //});
    //});
  //});

  //context('already associated', function(){
    //beforeEach(function(done){
      //user.pets.concat([fish, dog], function(err){
        //user.save(done);
      //});
    //});

    //describe('#find', function(){
      //it('finds pets from the parent model with the correct type', function(done) {
        //user.pets.find({ _id: fish }).findOne(function(err, foundFish){
          //should(foundFish._id).eql(fish._id);
          //should(foundFish.__t).eql('Fish');

          //user.pets.find({ _id: dog }).findOne(function(err, foundDog){
            //should(foundDog._id).eql(dog._id);
            //should(foundDog.__t).eql('Dog');
            //done();
          //});
        //});
      //});
    //});

    //describe('#populate', function(){
      //it('populates pets from the parent model with the correct type', function(done) {
        //user.pets.populate(function(err, user){
          //should.strictEqual(err, null);
          //var foundFish, foundDog;

          //user.pets.forEach(function(pet){
            //if(pet.id == fish.id){ foundFish = pet };
          //});

          //should.exist(foundFish);
          //should(foundFish.__t).eql('Fish');

          //user.pets.forEach(function(pet){
            //if(pet.id == dog.id){ foundDog = pet };
          //});

          //should.exist(foundDog);
          //should(foundDog.__t).eql('Dog');

          //done();
        //});
      //});
    //});

    //describe('#delete', function(){
      //it('removes pet from the parent model', function(done) {
        //user.pets.delete(fish, function(err, user){
          //user.save(function(err, user){
            //TwitterUser.findById(user.id, function(err, foundTwitterUser){
              //should(foundTwitterUser.pets).not.containEql(fish._id);
              //done();
            //});
          //});
        //});
      //});
    //});
  //});
});
