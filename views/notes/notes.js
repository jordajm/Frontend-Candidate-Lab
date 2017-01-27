exports.getNotes = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  req.app.db.models.Note.find({ _id: { $in: req.body.noteIds } }).exec(function(err, notes) {
    if (err){
      return workflow.emit('exception', err);
    }

    workflow.outcome.notes = notes;
    workflow.emit('response');
  });
};

exports.createNote = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);
  var ObjectID = require('mongodb').ObjectID;
  var noteId = new ObjectID();

  workflow.on('createNote', function() {
    req.body._id = noteId;

    req.app.db.models.Note.create(req.body, function(err) {
      if (err){
        return workflow.emit('exception', err);
      }

      workflow.emit('addNoteToAccount');
    });
  });

  workflow.on('addNoteToAccount', function() {
    var query = {
      _id: req.body.accountId
    };

    var update = {
      $push: { noteIds: noteId }
    };

    req.app.db.models.Account.findOneAndUpdate(query, update, {}, function(err) {
      if (err){
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('createNote');
};

exports.updateNote = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  var query = {
    _id: req.body._id
  };

  var update = {
    title: req.body.title,
    description: req.body.description
  };

  req.app.db.models.Note.findOneAndUpdate(query, update, {}, function(err) {
    if (err){
      return workflow.emit('exception', err);
    }

    workflow.emit('response');
  });
};

exports.deleteNote = function(req, res) {
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('deleteNote', function() {

    req.app.db.models.Note.findOneAndRemove({ _id: req.body.noteId }, function(err) {
      if (err){
        return workflow.emit('exception', err);
      }

      workflow.emit('removeNoteFromAccount');
    });
  });

  workflow.on('removeNoteFromAccount', function() {
    var query = {
      _id: req.body.accountId
    };

    var update = {
      $pull: { noteIds: req.body.noteId }
    };

    req.app.db.models.Account.findOneAndUpdate(query, update, {}, function(err) {
      if (err){
        return workflow.emit('exception', err);
      }

      workflow.emit('response');
    });
  });

  workflow.emit('deleteNote');
};










