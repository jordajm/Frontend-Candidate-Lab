'use strict';

exports = module.exports = function(app, passport) {

  // Home
  app.get (['/', '/user/forgot'], require('./views/auth/auth').init);

  // Auth
  app.get ('/user', require('./views/auth/auth').getUserData);
  app.post('/user/login', require('./views/auth/auth').login);
  app.get ('/user/logout', require('./views/auth/auth').logout);

   // Forgot Password
  // app.post('/user/forgot', require('./views/forgot/forgot').forgotPassword);
  // app.post('/user/reset/checktoken/', require('./views/forgot/forgot').checkResetToken);
  // app.post('/user/reset', require('./views/forgot/forgot').resetPassword);
  // app.post('/user/reset/loggedin', require('./views/forgot/forgot').loggedInResetPassword);
  // app.post('/user/changePassword', require('./views/forgot/forgot').changePassword);

};