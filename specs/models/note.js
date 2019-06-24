'use strict';

module.exports = function (mongoose) {
  let noteSchema = new mongoose.Schema({
    name: { type: String }
  }, { timestamps: true });

  noteSchema.belongsTo('noteable', {
    polymorphic: true,
    required: true,
    enum: [ 'User', 'Account' ]
  });

  return mongoose.model('Note', noteSchema);
};
