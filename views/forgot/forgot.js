'use strict';

exports.forgotPassword = function(req, res){
  var workflow = req.app.utility.workflow(req, res);
  var resetToken = Math.random().toString(36).substr(2, 7);
  
  workflow.on('checkIfUserExists', function(){
    req.app.db.models.Account.findOne({ username: req.body.email }, function(err, user) {
      if (err) {
        workflow.emit('exception', err);
      }
      if(user){
        workflow.emit('saveResetObject');
      }else{
        workflow.outcome.errfor.errDetail = 'User does not exist';
        return workflow.emit('response');
      }
    });
  });
  
  workflow.on('saveResetObject', function(){
    var resetObj = {
      email: req.body.email,
      resetToken: resetToken
    };
    req.app.db.models.PasswordReset.create(resetObj, function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }
      workflow.emit('getEmailConfig');
    });
  });

  workflow.on('getEmailConfig', function() {
    req.app.db.models.EmailConfig.findOne({}, function(err, config) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.emit('sendResetEmail', config);
    });
  });
  
  workflow.on('sendResetEmail', function(emailConfig){

    var nodemailer = require('nodemailer');
    
    var smtpConfig = {
      host: emailConfig.server,
      port: emailConfig.port,
      secure: emailConfig.useSSL,
      auth: {
          user: emailConfig.userId,
          pass: emailConfig.password
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    var transporter = nodemailer.createTransport(smtpConfig);

    var mailOptions   = {
      to      : req.body.email,
      from    : 'support@didash.com',
      subject : 'Password Reset Instructions',
      text    : 'Hello,\nWe received a request to help you reset your password.\nTo reset your password, click this link and choose a new password:\n' + emailConfig.appUrl + '/user/forgot?resetToken=' + resetToken + '\nIf you\'re still having problems, email us at support@didash.com and we\'ll be glad to help.\nThanks!\nThe DI-Dash Team'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return workflow.emit('exception', error);
        }
        
        console.log('Message sent to: ' + mailOptions.to);
        workflow.emit('response');
    });

  });

  workflow.emit('checkIfUserExists');
};

exports.checkResetToken = function(req, res){
  var workflow = req.app.utility.workflow(req, res);
  
  workflow.on('checkIfResetObjExists', function(){
    req.app.db.models.PasswordReset.findOne({ resetToken: req.body.resetToken }, function(err, resetObj) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (resetObj) {
        workflow.outcome.data = resetObj;
        workflow.emit('response');
      }else{
        workflow.emit('exception', 'Bad reset token');
      }
    });
  });
  
  workflow.emit('checkIfResetObjExists');
};

exports.resetPassword = function(req, res){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('checkResetToken', function() {
    req.app.db.models.PasswordReset.findOne({ resetToken: req.body.resetToken }, function(err, resetObj) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (resetObj && resetObj.email === req.body.email) {
        workflow.emit('resetPassword');
      }else{
        workflow.emit('exception', 'Bad reset token');
      }
    });
  });
  
  workflow.on('resetPassword', function(){

    req.app.db.models.Account.findByUsername(req.body.email).then(function(user){
        if (user){
            user.setPassword(req.body.password, function(){
                user.save();
                return workflow.emit('deleteResetObj');
            });
        } else {
            workflow.emit('exception', 'User not found - password could not be reset');
        }
    },function(err){
        workflow.emit('exception', err);
    });

  });
  
  workflow.on('deleteResetObj', function(){
    req.app.db.models.PasswordReset.find({ email: req.body.email }).remove( function(err) {
      if (err) {
        return workflow.emit('exception', err);
      }
      workflow.emit('response');
    });
  });
  
  workflow.emit('checkResetToken');
};

exports.loggedInResetPassword = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);
  
  req.app.db.models.Account.findByUsername(req.body.email).then(function(user){
      if (user){
          user.setPassword(req.body.password, function(){
              user.save();
              return workflow.emit('response');
          });
      } else {
          workflow.emit('exception', 'User not found - password could not be reset');
      }
  },function(err){
      workflow.emit('exception', err);
  });
};

// This method is used by the Change Password dialog box if a user is already logged in and wants to change their PW
exports.changePassword = function(req, res){
  var workflow = req.app.utility.workflow(req, res);
  
  workflow.on('resetPassword', function(){
     req.app.db.models.User.encryptPassword(req.body.first, function(err, hash) {
        if (err) {
          return workflow.emit('exception', err);
        }
        
        var userQuery = { _id: req.body.userId };
        var userUpdate = { password: hash };
        var userOptions = {};
        req.app.db.models.Account.findOneAndUpdate(userQuery, userUpdate, userOptions, function(err) {
          if (err) {
            return workflow.emit('exception', err);
          }
          workflow.emit('response');
        });
     });
  });
  
  workflow.emit('resetPassword');
};





