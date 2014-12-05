var zetta = require('zetta');
var Pinoccio = require('../');

zetta()
  .use(Pinoccio, process.env.PINOCCIO_USER, process.env.PINOCCIO_PASS)
  .listen(1337);
