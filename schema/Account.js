'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({ 
    username: String,
    password: String,
    noteIds: [String]
  },{
    timestamps: true
  });

  accountSchema.plugin( require('passport-local-mongoose') );
  
  app.db.model('Account', accountSchema);
};
