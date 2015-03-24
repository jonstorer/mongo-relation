var mongoose = require('mongoose'),
    ObjectId = mongoose.Schema.ObjectId,
    i = require('i')();

module.exports = function(schema, associatedModel, options) {
  var virtualName = i.underscore(associatedModel)
    , thisModelName;

  schema.virtual(virtualName).get(function(){
    var self = this;

    if(!thisModelName){
      for(schemaName in mongoose.modelSchemas){
        if(schema == mongoose.modelSchemas[schemaName]){
          thisModelName = schemaName;
          break;
        };
      };
    }

    return function(){
      var query = {};
      query[i.underscore(thisModelName)] = self._id;
      return mongoose.model(associatedModel).findOne(query);
    };
  });
};
