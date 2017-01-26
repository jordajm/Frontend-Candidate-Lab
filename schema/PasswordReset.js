'use strict';

exports = module.exports = function(app, mongoose) {
  var invitationSchema = new mongoose.Schema({ 
    email: String,
    resetToken: String,
    timestamp: { type: Date, default: Date.now },
  });
  
  app.db.model('PasswordReset', invitationSchema);
};