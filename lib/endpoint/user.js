'use strict';

var util          = require('util'),
    _             = require('lodash'),
    restify       = require('restify'),
    Promise       = require('bluebird'),
    User          = Promise.promisifyAll(require('../db/user'));

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

function InvalidUserResponse(msg) {
  restify.RestError.call(this, {
    statusCode: 400,
    restCode: 'InvalidUser',
    message: 'params did not pass validation: ' + msg,
    constructorOpt: InvalidUserResponse
  });

  this.name = 'InvalidUserResponse';
}
util.inherits(InvalidUserResponse, restify.RestError);

function getUsers(req, res, next) {
  var q =
    User
      .scan()
      .loadAll();

  Promise.promisifyAll(q);

  q.execAsync()
    .then(function(response) {
      if(response.Count) {
        res.send(200, _.map(response.Items, "attrs"));
        next();
      } else {
        throw new UserNotFoundError;
      }
    })
    .catch(UserNotFoundError, function(e) {
      next(new UserNotFoundResponse);
    })
    .catch(function(e) {
      next(e);
    });


}


function getUser(req, res, next) {
  var email = req.params.email;

  User.getAsync(email)
    .then(function(response) {
      if(response) {
        res.send(200, response.get());
      } else {
        throw new UserNotFoundError;
      }
    })
    .catch(UserNotFoundError, function(e) {
      next(new UserNotFoundResponse);
    })
    .catch(function(e) {
      next(e);
    });

}

function createUser(req, res, next) {
  var params = req.body;

  if (!params.password || !params.email) {
    next(new InvalidUserResponse('missing password/email'));
    return;
  }

  User.createAsync(params, {overwrite: false})
    .then(function(response) {
      res.send(200, response.get());
      next();
    })
    .catch(function(e){
      if(e.cause && e.cause.code === 'ConditionalCheckFailedException') {
        next(new InvalidUserResponse('Cannot create a user with an email that already exists'));
      } else {
        next(e);
      }
    });
}

function deleteUser(req, res, next) {
  var email = req.params.email;
  User.destroyAsync(email)
    .then(function(response){
      res.send(204);
      next();
    })
    .catch(function(e){
      next(e);
    });
}

function updateUser(req, res, next) {
  var params = req.body;
  params.email = req.params.email;

  User.updateAsync(params)
    .then(function(response){
      res.send(200, response.get());
      next();
    })
    .catch(function(e){
      next(e);
    });

}

module.exports = function(server) {
  server.post('/user', createUser);
  server.get('/user', getUsers);
  server.get('/user/:email', getUser);
  server.put('/user/:email', updateUser);
  server.del('/user/:email', deleteUser);
}
