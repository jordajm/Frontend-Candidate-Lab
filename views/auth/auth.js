var productionHTMLFile;

exports.init = function(req, res){
  var workflow = req.app.utility.workflow(req, res),
      path = require('path'),
      parent = path.join( __dirname, '/../../' );

  if(process.env['NODE_ENV'] === 'production'){

    if(!productionHTMLFile){
      // No production HTML file is cached so find it and cache it

      var fs = require('fs');

      fs.readdir('./adminBuild', function(err, files) {

        var filesLen = files.length;
        for(var i = 0; i < filesLen; i++){
          var thisFile = files[i];
          var fileType = thisFile.substring(thisFile.lastIndexOf('.') + 1, thisFile.length);
          if(fileType === 'html'){
            productionHTMLFile = thisFile;
            break;
          }
        }

        res.sendFile( parent + '/adminBuild/' + productionHTMLFile);
      });

    }else{
      // Send the cached production HTML file
      res.sendFile( parent + '/adminBuild/' + productionHTMLFile);

    }
    
  }else{
    // Send the dev HTML file
    res.sendFile( parent + '/views/admin.html');
  }
};

exports.getUserData = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.outcome.userData = req.user;
  workflow.emit('response');

};

exports.login = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);
  var passport = require('passport');

  passport.authenticate('local')(req, res, function (err) {
    if(err){
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.logout = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  req.logout();
  workflow.emit('response');

};

exports.signup = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);
  var passport = require('passport');
  var ObjectID = require('mongodb').ObjectID;
  var accountId = new ObjectID();

  workflow.on('checkIfUserExists', function() {
    req.app.db.models.Account.findOne({ username: req.body.email }, function(err, user) {
      if (err){
        return workflow.emit('exception', err);
      }

      if(user){
        return workflow.emit('exception', 'User already exists');
      }

      workflow.emit('createAccount');
      
    });

  });

  workflow.on('createAccount', function() {
    var userData = {
      _id: accountId,
      username : req.body.email,
    };
    req.app.db.models.Account.register(new req.app.db.models.Account(userData), req.body.password, function(err, account) {
        if (err) {
            return workflow.emit('exception', err);
        }

        workflow.emit('response');

    });
  });

  workflow.emit('checkIfUserExists');
};














