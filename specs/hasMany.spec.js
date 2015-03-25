require('./spec_helper');

var mongoose = require('mongoose')
  , async    = require('async')
  , should   = require('should')
  , uuid     = require('node-uuid');


describe.only('hasMany without options', function(){
  var userSchema, User, user, widgetSchema, Widget, widget;

  before(function(){
    widgetSchema = mongoose.Schema({ name: String });
    widgetSchema.belongsTo('user');
    Widget = mongoose.model('Widget', widgetSchema);

    userSchema = new mongoose.Schema({});
    userSchema.hasMany('widgets');
    User = mongoose.model('User', userSchema);
  });

  describe('schema', function(){
    it('has a virtual to represent the relationship', function(){
      should(userSchema.virtuals.widgets).not.equal(undefined);
      should(userSchema.virtuals.widgets.path).equal('widgets');
    });
  });

  describe('instance', function(){
    before(function(){
      user = new User();
    });

    it('returns a relationship', function(){
      should(user.widgets.build).be.a.Function;
      should(user.widgets.create).be.a.Function;
      should(user.widgets.find).be.a.Function;
      should(user.widgets.findOne).be.a.Function;
      should(user.widgets.append).be.a.Function;
      should(user.widgets.concat).be.a.Function;
      should(user.widgets.remove).be.a.Function;
      should(user.widgets.delete).be.a.Function;
    });
  });

  describe('build', function(){
    before(function(){
      user = new User();
    });

    it('instantiates one child document', function() {
      built = user.widgets.build({ name: 'Beam' });

      should(built).be.an.instanceof(Widget);
      should(built.user).eql(user._id);
      should(built.name).equal('Beam')
    });

    it('instantiates many children documents', function() {
      built = user.widgets.build([{}, {}]);

      built.forEach(function(widget){
        should(widget).be.an.instanceof(Widget);
        should(widget.user).eql(user._id);
      });
    });
  });

  describe('create', function(){
    before(function(){
      user = new User();
    });

    it('creates one child document', function(done) {
      user.widgets.create({ name: 'Beam' }, function(err, widget) {
        should.strictEqual(err, null);

        should(widget).be.an.instanceof(Widget);
        should(widget.name).equal('Beam')
        should(widget.user).equal(user._id);
        done();
      });
    });

    it('creates many child document', function(done) {
      user.widgets.create([{}, {}], function(err, widgets) {
        should.strictEqual(err, null);

        widgets.forEach(function(widget){
          should(widget).be.an.instanceof(Widget);
          should(widget.user).equal(user._id);
        });

        done();
      });
    });
  });

  describe('find', function(){
    var find;

    before(function(){
      user = new User();
    });

    it('returns a criteria', function() {
      find = user.widgets.find();
      should(find).be.instanceOf(mongoose.Query);
      should(find.op).equal('find');
      should(find.model.modelName).equal('Widget');
      should(find._conditions.user).equal(user._id);
    });

    it('handles query', function() {
      find = user.widgets.find({ title: 'Win' });
      should(find._conditions.title).equal('Win');
    });

    it('handles fields', function() {
      find = user.widgets.find({}, 'name');
      should(find._fields.name).eql(1);
    });

    it('handles options', function() {
      find = user.widgets.find({}, null, { skip: 6, limit: 3 });
      should(find.options.skip).eql(6);
      should(find.options.limit).eql(3);
    });

    describe('handling callbacks', function(){
      before(function(done){
        user.widgets.create([{ }, { }], done);
      });

      it('with conditions, fields, options, callback', function(done) {
        find = user.widgets.find({}, null, null, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with conditions, fields, callback', function(done) {
        find = user.widgets.find({}, null, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with conditions, callback', function(done) {
        find = user.widgets.find({}, function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });

      it('with callback', function(done) {
        find = user.widgets.find(function(err, widgets){
          should(widgets).have.lengthOf(2);
          widgets.forEach(function(widget){
            should(widget).be.an.instanceof(Widget);
          });
          done();
        });

        should(find).be.instanceOf(mongoose.Query);
      });
    });

  });

  describe('findOne', function(){
    var find;

    before(function(done){
      user = new User();
      user.widgets.create([{ }, { }], done);
    });

    it('returns a findOne critera', function() {
      find = user.widgets.findOne();
      should(find).be.instanceOf(mongoose.Query);
      should(find.op).equal('findOne');
      should(find.model.modelName).equal('Widget');
      should(find._conditions.user).equal(user._id);
    });

    it('handles the callback correctly', function(done) {
      user.widgets.findOne(function(err, widget){
        should(widget.user).eql(user._id);
        done();
      });
    });
  });

  describe('append', function(){
    var other_widget;

    before(function(){
      user = new User();
      widget = new Widget();
      otherWidget = new Widget();

      should(widget.isNew).be.true;
      should(otherWidget.isNew).be.true;
    });

    it('appends a single child', function(done) {
      user.widgets.append(widget, function(err, appendedWidget){
        should(widget._id).eql(appendedWidget._id);
        should(widget.isNew).be.false;
        should(appendedWidget.isNew).be.false;

        should(widget.user).eql(user._id);
        should(appendedWidget.user).eql(user._id);

        done();
      });
    });

    it('appends many children', function(done) {
      user.widgets.append([widget, otherWidget], function(err, appendedWidgets){
        should(appendedWidgets).have.lengthOf(2);

        should(widget._id).eql(appendedWidgets[0]._id);
        should(widget.user).eql(user._id);
        should(widget.isNew).be.false;
        should(appendedWidgets[0].user).eql(user._id);
        should(appendedWidgets[0].isNew).be.false;

        should(otherWidget._id).eql(appendedWidgets[1]._id);
        should(otherWidget.user).eql(user._id);
        should(otherWidget.isNew).be.false;
        should(appendedWidgets[1].user).eql(user._id);
        should(appendedWidgets[1].isNew).be.false;

        done();
      });
    });

  });

  describe('concat', function(){
    before(function(){
      user = new User({});
    });

    it('is sugar for append', function(){
      should(user.widgets.append).eql(user.widgets.concat);
    });
  });

});

describe('hasMany', function() {
  describe('Parent Relationship', function() {
    it('appends one instantiated child document', function(done) {
      var user  = new User(),
          tweet = new Tweet();

      user.tweets.append(tweet, function(err, tweet) {
        should.strictEqual(err, null);
        tweet.author.should.eql(user._id);
        user.tweets.should.containEql(tweet._id);
        done();
      });

    });

    it('concatenates many instantiated child documents', function(done) {
      var user   = new User(),
          tweets = [ new Tweet(), new Tweet() ];

      user.tweets.concat(tweets, function(err, tweets) {
        should.strictEqual(err, null);

        var count = tweets.length;
        tweets.forEach(function(tweet){
          tweet.author.should.eql(user._id);
          user.tweets.should.containEql(tweet._id);
          --count || done();
        });
      });
    });

    it('finds children documents', function(done) {
      var user   = new User(),
          tweets = [ { title: 'Blog tweet #1' },
                     { title: 'Blog tweet #2' } ]

      user.tweets.create(tweets, function(err, user, tweets) {
        should.strictEqual(err, null);
        var find = user.tweets.find({});
        find.exec(function(err, newTweets) {
          should.strictEqual(err, null);

          find.should.be.an.instanceof(mongoose.Query);
          find._conditions.should.have.property('_id');
          find._conditions.should.have.property('author');
          find._conditions._id['$in'].should.be.an.instanceof(Array);

          newTweets.should.have.length(2);

          newTweets.forEach(function(tweet) {
            user.tweets.should.containEql(tweet._id)
            tweet.should.be.an.instanceof(Tweet);
            tweet.author.should.eql(user._id);
          });

          find.find({ title: 'Blog tweet #1' }, function(err, otherTweets) {
            find._conditions.title.should.equal('Blog tweet #1');
            find._conditions.should.have.property('_id');

            otherTweets.should.have.length(1);
            otherTweets[0].title.should.equal('Blog tweet #1');
            done();
          });
        });
      });
    });

    it('deletes dependent child documents', function(done) {
      var user   = new User(),
          tweets = [ { title: 'Blog tweet #1' },
                     { title: 'Blog tweet #2' } ];

      user.tweets.create(tweets, function(err, user, tweets){
        var tweet = tweets[0];
        user.tweets.remove(tweet._id, function(err, user){
          should.strictEqual(err, null);

          user.tweets.should.not.containEql(tweet._id);
          user.tweets.should.have.length(1);

          // Tweet, be gone!
          Tweet.findById(tweet._id, function(err, found){
            should.strictEqual(err, null);
            should.not.exist(found);
            done();
          });
        });
      });
    });

    it('nullifies dependent child documents', function(done){
      var user = new User(),
          tags = [ { name: 'awesome' },
                   { name: 'omgbbq' } ];

      user.tags.create(tags, function(err, user, tags){
        var tag = tags[0];
        user.tags.remove(tag._id, function(err, user){
          should.strictEqual(err, null);

          user.tags.should.not.containEql(tag._id);
          user.tags.should.have.length(1);

          // Tweet, be nullified!
          Tag.findById(tag._id, function(err, tag){
            should.strictEqual(err, null);
            should.not.exist(tag.user);
            done();
          });
        });
      });
    });

    it('populates child documents in path', function(done){
      var user   = new User(),
          tweets = [ { title: 'Blog tweet #1' },
                     { title: 'Blog tweet #2' } ];

      user.tweets.create(tweets, function(err, user, tweets){
        user.save(function(err, user){
          User.findById(user._id).populate('tweets').exec(function(err, populatedUser){
            should.strictEqual(err, null);

            var testSugar = function() {
              // Syntactic sugar
              user.tweets.populate(function(err, user){
                should.strictEqual(err, null);

                var count = user.tweets.length;
                user.tweets.forEach(function(tweet){
                  tweet.should.be.an.instanceof(Tweet);
                  --count || done();
                });
              });
            };

            var count = populatedUser.tweets.length;
            populatedUser.tweets.forEach(function(tweet){
              tweet.should.be.an.instanceof(Tweet);
              --count || testSugar();
            });
          });
        });
      });
    });
  });

  describe('polymorphic relation', function() {
    describe('relationship', function() {
      it('knows when a relationship is polymorphic', function() {
        should(User.schema.paths.locations).exist;
        should(User.schema.paths.locations.options.as).equal('locateable');
      });
    });

    describe('#create', function() {
      it('creates a polymorphic child', function(done) {
        var user  = new User(),
            local = { place: "Ed's Happy Place" };

        user.locations.create(local, function(err, user, local) {
          should.strictEqual(err, null);

          user.should.be.an.instanceof(User);
          local.should.be.an.instanceof(Location);
          local.place.should.equal("Ed's Happy Place");
          local.locateable.should.equal(user._id);
          local.locateable_type.should.equal('User');
          User.findById(user._id, function(err, user){
            should(user.locations).be.empty;
            done();
          });
        });
      });

      it('creates many polymorphic children', function(done) {
        var user      = new User(),
            locations = [ { place: "Ed's Happy Place" },
                          { place: "Ed's Safe Place" } ];

        user.locations.create(locations, function(err, user, locations) {
          should.strictEqual(err, null);

          user.should.be.an.instanceof(User);
          var count = locations.length;
          locations.forEach(function(local){
            local.should.be.an.instanceof(Location);
            local.locateable.should.equal(user._id);
            local.locateable_type.should.equal('User');
            --count || done();
          })
        });
      });
    });

    describe('#append', function() {
      it('associates the child to the parent', function(done) {
        var user  = new User(),
            local = new Location();

        user.locations.append(local, function(err, local) {
          should.strictEqual(err, null);
          local.locateable.should.eql(user._id);
          local.locateable_type.should.eql('User');
          done();
        });
      });
    });

    describe('#concat', function() {
      it('concatenates many instantiated child documents', function(done) {
        var user      = new User(),
            locations = [ new Location(), new Location() ];

        user.locations.concat(locations, function(err, locations) {
          should.strictEqual(err, null);

          var count = locations.length;
          locations.forEach(function(local){
            local.locateable.should.eql(user._id);
            local.locateable_type.should.eql('User');
            --count || done();
          });
        });
      });
    });

    describe('#find', function() {
      it('returns a Mongoose Query', function() {
        var user = new User();

        var find = user.locations.find();
        should(find).be.an.instanceof(mongoose.Query);
        should(find._conditions.locateable).eql(user._id);
        should(find._conditions.locateable_type).eql('User');
      });

      it('takes query params', function() {
        var user = new User();
        var find = user.locations.find({ place: 'here' });
        should(find._conditions.place).eql('here');
      });

      it('finds child documents', function(done) {
        var find,
            user      = new User(),
            locations = [ {}, {} ];

        user.locations.create(locations, function(err, user, locations) {
          user.locations.find(function(err, foundLocations) {
            should.strictEqual(err, null);

            foundLocations.should.have.length(2);

            var count = foundLocations.length;
            foundLocations.forEach(function(local) {
              local.should.be.an.instanceof(Location);
              should(local.locateable).eql(user._id);
              should(local.locateable_type).eql('User');
              --count || done();
            });
          });
        });
      });

      it('searching for children documents', function(done) {
        var find,
            user      = new User(),
            locations = [ { place: 'Here' },
                          { place: 'There' } ];

        user.locations.create(locations, function(err, user, locations) {
          find = user.locations.find({ place: 'There' });
          find.exec(function(err, foundLocations) {
            should.strictEqual(err, null);
            foundLocations.should.have.length(1);
            foundLocations[0].place.should.equal('There');
            done();
          });
        });
      });
    });

    describe('#delete', function() {
      var user, locations, local;
      beforeEach(function(done){
        user = new User();
        user.save(function(err){
          user.locations.create([ { }, { } ], function(err, user, _locations){
            locations = _locations;
            local = locations[0];
            done();
          });
        });
      });

      // tests do not have a polymorphic relationship with dependecy set
      it.skip('deletes dependent child documents', function(done) {
        user.locations.remove(local._id, function(err, user){
          should.strictEqual(err, null);

          Location.findById(local._id, function(err, found){
            should.strictEqual(err, null);
            should.not.exist(found);
            done();
          });
        });
      });

      // tests do not have a polymorphic relationship with dependecy set
      it.skip('allows you to pass in a whole model', function(done) {
        var local = locations[0];
        user.locations.remove(local, function(err, user){
          should.strictEqual(err, null);

          Location.findById(local._id, function(err, found){
            should.strictEqual(err, null);
            should.not.exist(found);
            done();
          });
        });
      });

      it('returns an error when trying to delete a model that is not a child', function(done) {
        var local = new Location();
        local.save(function(err){
          should.strictEqual(err, null);

          user.locations.remove(local.id, function(err, user){
            should.exist(err);
            Location.findById(local._id, function(err, found){
              should.exist(found);
              done();
            });
          });
        });
      });
    });

    // tests do not have a polymorphic relationship with nullify set
    describe.skip('#nullifies', function() {
      it('nullifies dependent child documents', function(done){
        var user      = new User(),
            addresses = [ {}, {} ];

        user.addresses.create(addresses, function(err, user, addresses){
          var addressOne = addresses[0];
          var addressTwo = addresses[1];
          user.addresses.remove(addressOne._id, function(err, user){
            should.strictEqual(err, null);

            user.addresses.should.have.length(0);

            Address.findById(addressOne._id, function(err, address){
              should.strictEqual(err, null);
              should.not.exist(address.user);
              done();
            });
          });
        });
      });
    });

    // has not been defined
    describe.skip('#populate', function() {
      it('returns an error', function(done){
        var user          = new User(),
            notifications = [ {}, {} ];

        user.notifications.create(notifications, function(err, user, notifications){
          user.save(function(err, user){
            user.notifications.populate(function(err, user){
              err.should.be.an.instanceof(Error);
              err.message.should.eql('Cannot populate when setParent is false. Use #find.')
              done();
            });
          });
        });
      });
    });
  });

  describe('Parent Relationship when setParent is false', function() {
    describe('#create', function() {
      it('creates one child document', function(done) {
        var user         = new User(),
            notification = { message: 'Check out new relationships!' };

        user.notifications.create(notification, function(err, user, notification) {
          should.strictEqual(err, null);

          user.should.be.an.instanceof(User);
          notification.should.be.an.instanceof(Notification);
          notification.message.should.equal('Check out new relationships!')
          notification.user.should.equal(user._id);
          done();
        });
      });

      it('does not add the child id to the parent', function(done) {
        var user         = new User(),
            notification = { message: 'Check out new relationships!' };

        user.notifications.create(notification, function(err, user, notification) {
          should.strictEqual(err, null);
          user.notifications.should.have.length(0);
          user.notifications.should.be.empty;
          done();
        });
      });

      it('creates many children documents', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog notification #1' },
                              { message: 'Blog notification #2' } ];

        user.notifications.create(notifications, function(err, user, notifications) {
          should.strictEqual(err, null);

          notifications.should.have.length(2);

          var count = notifications.length;
          notifications.forEach(function(notification) {
            notification.should.be.an.instanceof(Notification);
            notification.user.should.equal(user._id);
            --count || done()
          });
        });
      });

      it('does not add child ids to the parent', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog notification #1' },
                              { message: 'Blog notification #2' } ];

        user.notifications.create(notifications, function(err, user, notifications) {
          should.strictEqual(err, null);

          user.notifications.should.have.length(0);
          var count = notifications.length;
          notifications.forEach(function(notification) {
            user.notifications.should.not.containEql(notification._id)
            --count || done()
          });
        });
      });
    });

    describe('#append', function() {
      it('associates the child to the parent', function(done) {
        var user         = new User(),
            notification = new Notification();

        user.notifications.append(notification, function(err, notification) {
          should.strictEqual(err, null);
          notification.user.should.eql(user._id);
          done();
        });
      });

      it('does not add the child id to the parent', function(done) {
        var user         = new User(),
            notification = new Notification();

        user.notifications.append(notification, function(err, notification) {
          should.strictEqual(err, null);
          user.notifications.should.be.empty;
          done();
        });
      });
    });

    describe('#concat', function() {
      it('concatenates many instantiated child documents', function(done) {
        var user          = new User(),
            notifications = [ new Notification(), new Notification() ];

        user.notifications.concat(notifications, function(err, notifications) {
          should.strictEqual(err, null);

          var count = notifications.length;
          notifications.forEach(function(notification){
            notification.user.should.eql(user._id);
            //user.notifications.should.containEql(notification._id);
            --count || done();
          });
        });
      });

      it('does not add child ids to the parent', function(done) {
        var user          = new User(),
            notifications = [ new Notification(), new Notification() ];

        user.notifications.concat(notifications, function(err, notifications) {
          should.strictEqual(err, null);

          var count = notifications.length;
          notifications.forEach(function(notification){
            user.notifications.should.not.containEql(notification._id);
            --count || done();
          });
        });
      });
    });

    describe('#find', function() {
      it('returns a Mongoose Query', function(done) {
        var user          = new User(),
            notifications = [ {}, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({})
          find.should.be.an.instanceof(mongoose.Query);
          find._conditions.should.have.property('user');
          done();
        });
      });

      it('takes options to find by', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Alert!' }, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({ message: 'Alert!' })
          find._conditions.should.have.property('user');
          find._conditions.should.have.property('message');
          find._conditions.message.should.eql('Alert!');
          done();
        });
      });

      it('finds child documents', function(done) {
        var user          = new User(),
            notifications = [ {}, {} ]

        user.notifications.create(notifications, function(err, user, notifications) {
          var find = user.notifications.find({});
          find.exec(function(err, foundNotifications) {
            should.strictEqual(err, null);

            foundNotifications.should.have.length(2);

            var count = foundNotifications.length;
            foundNotifications.forEach(function(notification) {
              notification.should.be.an.instanceof(Notification);
              notification.user.should.eql(user._id);
              --count || done();
            });
          });
        });
      });

      it('searching for children documents', function(done) {
        var find,
            user           = new User(),
            notifications  = [ { message: 'Blog notification #1' },
                               { message: 'Blog notification #2' } ]

        user.notifications.create(notifications, function(err, user, notifications) {
          find = user.notifications.find({ message: 'Blog notification #1' });
          find.exec(function(err, foundNotifications) {
            should.strictEqual(err, null);

            foundNotifications.should.have.length(1);
            foundNotifications[0].message.should.equal('Blog notification #1');
            done();
          });
        });
      });
    });

    describe('#delete', function() {
      it('deletes dependent child documents', function(done) {
        var user          = new User(),
            notifications = [ { message: 'Blog tweet #1' },
                              { message: 'Blog tweet #2' } ];

        user.notifications.create(notifications, function(err, user, notifications){
          var notification = notifications[0];
          user.notifications.remove(notification._id, function(err, user){
            should.strictEqual(err, null);

            Notification.findById(notification._id, function(err, found){
              should.strictEqual(err, null);
              should.not.exist(found);
              done();
            });
          });
        });
      });
    });

    describe('#nullifies', function() {
      it('nullifies dependent child documents', function(done){
        var user      = new User(),
            addresses = [ {}, {} ];

        user.addresses.create(addresses, function(err, user, addresses){
          var addressOne = addresses[0];
          var addressTwo = addresses[1];
          user.addresses.remove(addressOne._id, function(err, user){
            should.strictEqual(err, null);

            user.addresses.should.have.length(0);

            Address.findById(addressOne._id, function(err, address){
              should.strictEqual(err, null);
              should.not.exist(address.user);
              done();
            });
          });
        });
      });
    });

    describe('#populate', function() {
      it('returns an error', function(done){
        var user          = new User(),
            notifications = [ {}, {} ];

        user.notifications.create(notifications, function(err, user, notifications){
          user.save(function(err, user){
            user.notifications.populate(function(err, user){
              err.should.be.an.instanceof(Error);
              err.message.should.eql('Cannot populate when setParent is false. Use #find.')
              done();
            });
          });
        });
      });
    });
  });
});

describe('with descriminators', function() {
  var category, dog, fish;
  beforeEach(function(done){
    dog  = new Dog({ name: 'Maddie', date_of_birth: new Date('12/24/2005'), breed: 'Border Collie Mix' });
    fish = new Fish({ name: 'Dory', date_of_birth: new Date('5/30/2003') });
    category = new Category();
    category.save(done);
  });

  context('associating', function() {
    describe('#create', function() {
      it('creates the superclass', function(done){
        category.pets.create({}, function(err, category, pet){
          should(pet.__t).eql.undefined;
          pet.should.be.an.instanceof(Pet);
          should(category.pets).containEql(pet._id);
          done();
        });
      });

      it('creates a subclass', function(done){
        category.pets.create(dog, function(err, category, cDog){
          should.strictEqual(err, null);
          should(dog._id).eql(cDog._id);
          should(dog.__t).eql('Dog');
          should(dog.__t).eql(cDog.__t);
          done();
        });
      });
    });

    describe('#append', function() {
      it('appends an instantiated child document', function(done) {
        category.pets.append(fish, function(err, fish){
          should.strictEqual(err, null);
          category.pets.should.containEql(fish._id);
          should(fish.__t).eql('Fish');
          done();
        });
      });
    });

    describe('#concat', function() {
      it('concats a hertogenious set of child documents', function(done) {
        category.pets.concat([fish, dog], function(err, pets){
          should.strictEqual(err, null);

          category.pets.should.containEql(fish._id);
          should(pets[0].__t).eql('Fish');

          category.pets.should.containEql(dog._id);
          should(pets[1].__t).eql('Dog');
          done();
        });
      });
    });
  });

  context('already associated', function() {
    beforeEach(function(done){
      category.pets.concat([fish, dog], function(err){
        category.save(done);
      });
    });

    describe('#find', function() {
      it('finds pets from the parent model with the correct type', function(done) {
        category.pets.find({ _id: fish }).findOne(function(err, foundFish){
          should(foundFish._id).eql(fish._id);
          should(foundFish.__t).eql('Fish');

          category.pets.find({ _id: dog }).findOne(function(err, foundDog){
            should(foundDog._id).eql(dog._id);
            should(foundDog.__t).eql('Dog');
            done();
          });
        });
      });
    });

    describe('#populate', function() {
      it('populates pets from the parent model with the correct type', function(done) {
        category.pets.populate(function(err, category){
          should.strictEqual(err, null);
          var foundFish, foundDog;

          category.pets.forEach(function(pet){
            if(pet.id == fish.id){ foundFish = pet };
          });

          should.exist(foundFish);
          should(foundFish.__t).eql('Fish');

          category.pets.forEach(function(pet){
            if(pet.id == dog.id){ foundDog = pet };
          });

          should.exist(foundDog);
          should(foundDog.__t).eql('Dog');

          done();
        });
      });
    });

    describe('#delete', function() {
      it('removes pet from the parent model', function(done) {
        category.pets.delete(fish, function(err, category){
          category.save(function(err, user){
            Category.findById(category.id, function(err, foundCategory){
              should(foundCategory.pets).not.containEql(fish._id);
              done();
            });
          });
        });
      });
    });
  });
});
