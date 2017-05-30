var http = require('http');
var app = require('./app.js');
var config = require('config');

var log = require('lib/log')(module);

var server = http.createServer(app);

server.listen(config.get('port'), function () {
    log.info('Express server listening on port ' + config.get('port'));
});

// var io = require('./socket')(server, app);
// app.set('io', io);