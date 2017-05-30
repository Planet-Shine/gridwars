var connect = require('connect');
var mongoose   = require('lib/mongoose');
var MongoStore = require('connect-mongo')(connect);

var sessionStore = new MongoStore({mongooseConnection : mongoose.connection});

module.exports = sessionStore;