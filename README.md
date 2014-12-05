# Pinoccio Zetta Driver

Zetta driver for interacting with the [Pinoccio](https://pinocc.io) through their api.

## Install

```
npm install zetta-pinoccio-api-driver
```

## Usage

```js
var zetta = require('zetta');
var Pinoccio = require('zetta-pinoccio-api-driver');

zetta()
.use(Pinoccio, 'email@example.com', 'yourpassword')
.listen(1337);

```
