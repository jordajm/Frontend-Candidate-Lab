'use strict';

exports = module.exports = function(app, mongoose) {

  require('./schema/Account')(app, mongoose);

  require('./schema/PasswordReset')(app, mongoose);

};