
var request = require('request');
var cloudMqtt = require('../cloudMqtt');
var express = require('express');
var mongoose = require('mongoose');
var Users = require('../models/user');
var Verify = require('./verify');



var BASE_URL = 'https://api.cloudmqtt.com/';
var username = cloudMqtt.username;
var password = cloudMqtt.password;
var auth = "Basic " + new Buffer(username + ":" + password).toString("base64");
var headers = {
    'Content-Type': 'application/json',
    "Authorization" : auth
};


var provisioningRouter = express.Router();

//exports provisioningRouter
module.exports = provisioningRouter;

provisioningRouter.route('/')

//GET all registered users 'ONLY FOR ADMINS!!!!!!!!'
.get(Verify.verifyOrdinaryUser, function(req,res){
  var options = {
      url: BASE_URL + 'user',
      method: 'GET',
      headers: headers
  };
  request(options, function(error,response,body){
    if (!error && response.statusCode == 200) {
      res.json({"message":JSON.parse(body)});
    } else {
      res.json({"Error": response.statusCode});

    }
  });
})

//POST Activate a new user on CloudMqtt and set the default topic. USER enters only password
.post(Verify.verifyOrdinaryUser, function(req,res){
  var options = {
      url: BASE_URL + 'user',
      method: 'POST',
      headers: headers,
      json: {"username":req.decoded._doc.username,"password":req.body.password}
  };
  //Create user on CloudMqtt
  request(options, function(error,response,body){
    if (!error && response.statusCode == 204) {
      var options = {
          url: BASE_URL + 'acl',
          method: 'POST',
          headers: headers,
          json: {"username":req.decoded._doc.username, "topic": "mysensor/" + req.decoded._doc.username + '/#', "read": true, "write": true}
      };
      //Create ACL rule for user
      request(options, function(error,response,body){
          if (!error && response.statusCode == 204) {
            //Change user status 'active" to TRUE ENCRYPT THE PASSWORD
            Users.findOneAndUpdate({username: req.decoded._doc.username},{$set:{activated:true,cmq_password:req.body.password}}, {new:true}, function(err,resp){
              if (err) throw err;
                res.json({"message":"Your actived",resp:resp});
            })
          } else {
            res.json({"Error": response.statusCode});
          }
      });
    } else {
      res.json(response);
    }

  });

})


//USER Deactivate user on CloudMqtt
.delete(Verify.verifyOrdinaryUser, function(req,res){
  var options = {
      url: BASE_URL + 'user/' + req.decoded._doc.username,
      method: 'DELETE',
      headers: headers
  };

   request(options, function(error,response,body){
    if (!error && response.statusCode == 204) {
      //ENCRYPT THE PASSWORD
      Users.findOneAndUpdate({username: req.decoded._doc.username},{$set:{activated:false,cmq_password:''}},{new:true}, function(err,resp){
        if (err) throw err;
          res.json({"message":"User deleted",resp:resp});
      })
          } else {
            res.json({"Error": response.statusCode});
          }
    });

  });





///get all users List a user, returns 404 if the user doesn't exists.

// Basic Auth
// get https://api.cloudmqtt.com/user


//get specific user 409 if not exist
//get  https://api.cloudmqtt.com/user/user_1


//delete 404 if not exists
//delete https://api.cloudmqtt.com/user/user_1

//post new user
//post https://api.cloudmqtt.com/user
//Header Content-Type: application/json body {"username": "new-user", "password":"mypass"}


//list all ACL rules
// get https://api.cloudmqtt.com/acl

// create new ACL rule for user
//post https://api.cloudmqtt.com/acl header Content-Type: application/json body '{"username":"test", "topic":"readonly", "read": true, "write": false}'

// delete new ACL rule for user
//delete https://api.cloudmqtt.com/acl header Content-Type: application/json body '{"username":"test", "topic":"readonly"}'
