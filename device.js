var util = require('util');
var Color = require('color');
var Device = require('zetta-device');

var Pinoccio = module.exports = function(data, client) {
  for (k in data) {
    this[k] = data[k];
  }

  // led monitor
  this.led = [0, 0, 0];

  // temp montior
  this.tempC = NaN;

  // battery monitors
  this.batteryVoltage = NaN;
  this.batteryPercent = NaN;
  this.batteryCharging = NaN;

  this._client = client;
  Device.call(this);
};
util.inherits(Pinoccio, Device);

Pinoccio.prototype.init = function(config) {
  config
    .type('pinoccio')
    .state('offline')
    .name(this.name)
    .when('online', { allow: ['set-led-color', 'turn-led-off', 'turn-led-on']})
    .map('set-led-color', this.setLedColor, [ { type: 'color', name: 'color'} ])
    .map('turn-led-off', this.turnLedOff)
    .map('turn-led-on', this.turnLedOn)
    .monitor('led')
    .monitor('tempC')
    .monitor('batteryVoltage')
    .monitor('batteryPercent')
    .monitor('batteryCharging')
  
  this.sync();
};

Pinoccio.prototype.turnLedOn = function(cb) {
  this._client.post('/v1/' + this.troop + '/' + this.deviceId + '/command', { command: 'led.on' }, cb);
};

Pinoccio.prototype.turnLedOff = function(cb) {
  this._client.post('/v1/' + this.troop + '/' + this.deviceId + '/command', { command: 'led.off' }, cb);
};

Pinoccio.prototype.setLedColor = function(color, cb) {
  try {
    color = Color(color).rgbArray();
  } catch(err) {
    return cb(err);
  }
  var cmd = 'led.setrgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
  this._client.post('/v1/' + this.troop + '/' + this.deviceId + '/command', { command: cmd }, cb);
};

Pinoccio.prototype.sync = function() {
  var self = this;
  this._client.sync(function(event) {
    // filter events not for this device
    if(event.troop != self.troop || event.scout != self.deviceId) {
      return;
    }

    if (event.type === 'power') {
      self.batteryVoltage = event.value.voltage;
      self.batteryPercent = event.value.battery;
      self.batteryCharging = event.value.charging;
    }

    if (event.type === 'led') {
      self.led = event.value.led;
    }

    if (event.type === 'temp') {
      self.tempC = event.value.c;
    }
  });

  this._client.post('/v1/' + this.troop + '/' + this.deviceId + '/command', { command: 'scout.report'} ,function(err, json) {
    if (err) {
      self.state = 'offline';
      return;
    }
    
    if (!json.reply) {
      self.state = 'offline';
      return;
    }

    var obj = JSON.parse(json.reply);
    self.lead = obj.lead;
    self.version = obj.version;
    self.sketch = obj.sketch;
    self.build = obj.build;
    self.hardware = obj.hardware;
    self.state = 'online';
  });
};
