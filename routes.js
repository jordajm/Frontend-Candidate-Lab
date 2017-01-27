'use strict';

exports = module.exports = function(app, passport) {

  // Home
  app.get (['/', '/user/forgot'], require('./views/auth/auth').init);

  // Auth
  app.get ('/user', require('./views/auth/auth').getUserData);
  app.post('/user/signup', require('./views/auth/auth').signup);
  app.post('/user/login', require('./views/auth/auth').login);
  app.get ('/user/logout', require('./views/auth/auth').logout);

};