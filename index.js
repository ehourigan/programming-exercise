'use strict';

var restify = require('restify');
var vogels = require('vogels');

(function main() {
  var server = restify.createServer({
    name: 'user',
    version: '0.0.1'
  });

  // Clean up sloppy paths like //todo//////1//
  server.pre(restify.pre.sanitizePath());

  // Handles annoying user agents (curl)
  server.pre(restify.pre.userAgentConnection());

  // use req.log
  server.use(restify.requestLogger());

  // Use the common stuff you probably want
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.dateParser());
  server.use(restify.queryParser());//allows query string
  server.use(restify.gzipResponse());
  server.use(restify.jsonBodyParser( { mapParams: false })); //send in raw json, do not copy params from body


  require('./lib/endpoint/user')(server);
  require('./lib/endpoint/login')(server);

  server.listen(8080, function onListening() {
    console.log('listening on port 8080');
  });

  vogels.createTables({
    'users': {readCapacity: 5, writeCapacity: 10},
  }, function(err) {
    if (err) {
      console.log('Error creating tables: ', err);
    } else {
      console.log('Table created');
    }
  });

})();
