'use strict';

var util          = require('util'),
    _             = require('lodash'),
    restify       = require('restify'),
    Promise       = require('bluebird'),
    User          = Promise.promisifyAll(require('../db/user'));


var Unauthorized = function () {
  this.message = "Unauthorized";
  this.code = 403;
};

Unauthorized.prototype = Object.create(Error.prototype);
Unauthorized.prototype.constructor = Unauthorized;

var UserNotFoundError = function () {
  this.message = "User Not Found";
  this.code = 404;
};

UserNotFoundError.prototype = Object.create(Error.prototype);
UserNotFoundError.prototype.constructor = UserNotFoundError;

function UserNotFoundResponse() {
  restify.RestError.call(this, {
    statusCode: 404,
    restCode: 'UserNotFound',
    message: 'Unable to find the user',
    constructorOpt: UserNotFoundResponse
  });

  this.name = 'UserNotFoundError';
}
util.inherits(UserNotFoundResponse, restify.RestError);

function login(req, res, next) {
  var params = req.body;
  var email = params.email;
  var passwd = params.password;

  User.getAsync(email)
    .then(function(response) {
      if(response) {
        var user = response.get();
        if(passwd === user.password) {
          return User.updateAsync({email: email, last_login: new Date().toISOString()})
        } else {
          throw new Unauthorized;
        }
      } else {
        throw new UserNotFoundError;
      }
    })
    .then(function(response) {
      res.send(200, {message: "Welcome!"});
      next();
    })
    .catch(Unauthorized, function(e) {
      res.send(403);
      next();
    })
    .catch(UserNotFoundError, function(e) {
      next(new UserNotFoundResponse);
    })
    .catch(function(e) {
      next(e);
    });

}

module.exports = function(server) {
  server.post('/login', login);
}
