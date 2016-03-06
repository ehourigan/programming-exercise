'use strict';

var vogels    = require('vogels'),
    Joi       = require('joi'),
    AWS       = vogels.AWS;

AWS.config.loadFromPath(process.env.HOME + '/.ec2/local_dynamo.json');
//File in directory with following json data:
//{ "accessKeyId": "AKID", "secretAccessKey": "SECRET", "region": "REGION", "endpoint":"http://localhost:8000"}

var User = module.exports = vogels.define('User', {
  hashKey: 'email',
  timestamps: true,
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  schema: {
    email: Joi.string().email(),
    password: Joi.string(),
    name: Joi.string(),
    last_login: Joi.date()
  },
  tableName: 'users'
});
