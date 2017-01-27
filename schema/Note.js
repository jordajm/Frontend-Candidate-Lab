'use strict';

exports = module.exports = function(app, mongoose) {
  var noteSchema = new mongoose.Schema({ 
    accountId: String,
    title: String,
    description: String
  },{
    timestamps: true
  });
  
  app.db.model('Note', noteSchema);
};