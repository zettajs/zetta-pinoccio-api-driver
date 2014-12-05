var url = require('url');
var request = require('request');
var Parser = require('newline-json').Parser;

var api = module.exports = function(email, password) {
  if (password === undefined) {
    this.token = email;
  } else {
    this.email = email;
    this.password = password;
    this.token = null;
  }

  this.base = 'https://api.pinocc.io';

};

api.prototype._addToken = function(path) {
  var obj = url.parse(path, true);
  obj.query.token = this.token;
  delete obj.search;
  return url.format(obj);
};

api.prototype.get = function(path, cb) {
  path = this._addToken(path);
  request.get(this.base + path, function(err, res, body) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return cb(new Error('Failed:' + body));
    }

    var obj = null;
    try {
      obj = JSON.parse(body);
    } catch(err) {
      return cb(err);
    }
    cb(null, obj.data);
  });
};

api.prototype.post = function(path, opts, cb) {
  path = this._addToken(path);
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  var self = this;
  request.post({url: this.base + path, form: opts }, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    
    if (res.statusCode !== 200) {
      return cb(new Error('Failed:' + body));
    }
    
    var obj = null;
    try {
      obj = JSON.parse(body);
    } catch(err) {
      return cb(err);
    }
    cb(null, obj.data);
  });
};

api.prototype.login = function(cb) {
  var self = this;
  request.post({url: this.base + '/v1/login', form: { email: this.email, password: this.password } }, function(err, res, body) {
    if (err) {
      return cb(err);
    }
    
    if (res.statusCode !== 200) {
      return cb(new Error('Failed to login:' + body));
    }
    
    var obj = null;
    try {
      obj = JSON.parse(body);
      self.token = obj.data.token;
    } catch(err) {
      return cb(err);
    }
    cb();
  });  
};

api.prototype.sync = function(cb) {
  var self = this;
  function start() {
    var req = request.get(self.base + self._addToken('/v1/sync?stale=true'));
    var parser = new Parser();
    req.pipe(parser).on('data', function(data) {
      if (data.data && data.data.type !== 'token') {
        cb(data.data);
      }
    })
    req.on('end', function() {
      start();
    });
  }
  start();
};




