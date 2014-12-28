var cfg = require('./config').Config;

var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');

var departure = require('./departure');
var async = require('async');



// setup app routes
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

router.get('/', function (req, res) {
  res.write("Hallo Steffi!");
  res.end();
});

router.get('/departure-time/location/:long/:lat', function (req, res) {
  var lat = parseFloat(req.params.lat);
  var long = parseFloat(req.params.long);

  var nearPoint = {type: "Point", coordinates: [long, lat] };

  // query departure times from MVB
  var departureMapper = function (station, callback) {
    departure.get_departure_times(station.id, function (err, result) {
      // console.log(station.name + ": " + station.dist.calculated + " (" + station.location.coordinates + ")");
      if (err) {
        callback(err, null);
      } else {
        callback(null, { station_info: station, departure_times: result });
      }
    });
  }

  // mapping stations to departure times
  var stationMapper = function (err, stations) {
    if (err) {
      res.status(500).json({error: "finding close stations failed"});
      res.end();
    } else {
      async.map(stations, departureMapper, function (err, departureTimes) {
        if (err) {
          res.status(500).json({error: "getting departure times failed"});
          res.end();
        } else {
          res.json(departureTimes);
          res.end();
        }
      })
    }
  }

  Station.aggregate([
    {
      $geoNear: {
        near: nearPoint,
        distanceField: "dist.calculated",
        includeLocs: "dist.location",
        num: 5,
        spherical: true
      }
    }
  ], stationMapper);
});

app.use('/', router);

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
