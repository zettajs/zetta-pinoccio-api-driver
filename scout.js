var util = require('util');
var request = require('request');
var Scout = require('zetta-scout');
var Api = require('./api');
var Pinoccio = require('./device');

var PinoccioScout = module.exports = function(email, password) {
  this.email = email;
  this.password = password;
  Scout.call(this);
};
util.inherits(PinoccioScout, Scout);

PinoccioScout.prototype.init = function(cb) {
  var self = this;
  this.client = new Api(this.email, this.password);
  this.client.login(function(err) {
    cb(err);
    
    self.search();
    setInterval(self.search.bind(self), 15000);
  });
};

PinoccioScout.prototype.search = function() {
  var self = this;
  this.client.get('/v1/troops', function(err, data) {
    if (err) {
      console.error(err);
      return;
    }
    
    data.forEach(function(troop) {
      self.client.get('/v1/' + troop.id + '/scouts', function(err, data) {
        if (err) {
          console.error(err);
          return;
        }
        
        data.forEach(function(device) {
          device.deviceId = device.id;
          delete device.id;
          device.troop = troop.id;
          device.troopName = troop.name;
          self.found(device);
        });
      });
    });
  })
};

PinoccioScout.prototype.found = function(device) {
  var self = this;
  var q = this.server.where({ type: 'pinoccio', troop: device.troop, deviceId: device.deviceId });
  this.server.find(q, function(err, results) {
    if (err) {
      return;
    }
    
    if (results.length) {
      self.provision(results[0], Pinoccio, device, self.client);
    } else {
      self.discover(Pinoccio, device, self.client);
    }
    

  });
};
