var cfg = require('./config').Config;

var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');

var departure = require('./departure');
var async = require('async');

// connect to mongo db
var mongoose = require('mongoose');
var connection_string = 'mongodb://' + cfg.mongodb_host + '/' + cfg.mongodb_database;
// console.log(connection_string);
mongoose.connect(connection_string);
var db = mongoose.connection;

db.on('error', function (err) {
  console.log(err);
});

// create db schema
var stationSchema = mongoose.Schema({
  id: Number,
  name: String,
  location: {
    type: String,
    coordinates: [Number, Number]
  }
});

var Station = mongoose.model('Station', stationSchema);

// setup app routes
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

router.get('/stations', function (req, res) {
  Station.find({}, function (err, stations) {
    if (err) {
      res.status(500).json({error: 'couldn\'d find stations'});
      res.end();
    } else {
      res.json(stations);
      res.end();
    }
  });
});

router.get('/departure-time/station/:id', function (req, res) {
  Station.findOne({id: req.params.id}, function (err, station) {
    if (err) {
      res.status(500).json({error: 'internal error'});
      res.end();
    } else {
      if (station === null) {
        res.status(404).json({error: 'station not found'});
        res.end();
      } else {
        departure.get_departure_times(req.params.id, function (err, result) {
          if (err) {
            res.status(500).json({error: "coudn't get departure times"});
            res.end();
          } else {
            res.json(result);
            res.end();
          }
        });
      }
    }
  });
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
