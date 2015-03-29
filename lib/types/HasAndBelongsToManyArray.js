module.exports = exports = function (MongooseArray) {
  var HasAndBelongsToManyArray;

  function HasAndBelongsToManyArray ( ) {
    MongooseArray.apply(this, arguments);
  };
  HasAndBelongsToManyArray.prototype = Object.create(MongooseArray.prototype);
  HasAndBelongsToManyArray.prototype.build = function(){};

  return HasAndBelongsToManyArray;
};
