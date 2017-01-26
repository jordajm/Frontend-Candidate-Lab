'use strict';

exports.port = process.env.PORT || '3300';

exports.mongodb = {
  uri: process.env.MONGODB_URI || 'localhost:27017/test'
  // uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost:27017'
};

exports.cookieSecret = '68d1baa5-6750-4a5c-b351-056ccf73a3d4';

exports.sessionSecret = '712372be-4f21-4777-8894-163a7655e6d3';

exports.sendgrid  = require('sendgrid')("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");








