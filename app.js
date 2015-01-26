/*
  Copyright 2015 Johannes Filter, Rosario Raulin

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */

var cfg = require('./config').Config;

var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');
var cors = require('cors');

var departure = require('./departure');

// setup app routes
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

router.get('/', function (req, res) {
  res.render('pages/index.ejs');
});

router.get('/infos', function (req, res) {
  res.render('pages/infos.ejs');
});

router.get('/impressum', function (req, res) {
  res.render('pages/impressum.ejs');
});

router.get('/demo', function (req, res) {
  res.render('pages/demo.ejs');
});

// Cache Manifest
router.get('/cache.manifest', function (req, res) {
  res.header("Content-Type", "text/cache-manifest");
  res.send('CACHE MANIFEST\n# v5\nCACHE:\n/style.css\n/196x196.png\n/appstore.svg\n/email.png\n/facebook.png\n/icon.png\n/icon.svg\n/icon114.png\n/icon120.png\n/icon144.png\n/icon152.png\n/icon57.png\n/icon72.png\n/icon76.png\n/icon_smaller.png\n/twitter.png\nhttp://fonts.googleapis.com/css?family=Open+Sans:700,300\nhttp://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js\nhttp://ajax.googleapis.com/ajax/libs/jquerymobile/1.4.3/jquery.mobile.min.css\nhttp://ajax.googleapis.com/ajax/libs/jquerymobile/1.4.3/jquery.mobile.min.js\n/infos\n/demo\n/impressum\n/\n NETWORK:\n*\n');
});

router.get('/departure-time/location/:long/:lat', cors(), function (req, res) {
  departure.get_departure_times(req.params.long, req.params.lat, function (err, result) {
    if (err) {
      res.status(500).json({error: "coudn't get departure times"});
      res.end();
    } else {
      res.json(result);
      res.end();
    }
  });
});

app.use('/', router);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

// module interface
var server = http.createServer(app);

var boot = function (port) {
  server.listen(port);
};

var shutdown = function () {
  server.close();
};

if (require.main === module) {
  boot(cfg.port);
} else {
  exports.boot = boot;
  exports.shutdown = shutdown;
}
