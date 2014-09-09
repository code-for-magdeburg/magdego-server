var cfg = require('./config').Config;

var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');

// connect to mongo db
var mongoose = require('mongoose');
mongoose.connect('mongodb://' + cfg.mongodb_host + '/' + cfg.mongodb_name);
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

router.get('/:id', function (req, res) {
  Station.findOne({id: req.params.id}, function (err, station) {
    if (err) {
      res.status(500).json({error: 'internal error'});
    } else {
      if (station === null) {
        res.status(404).json({error: 'station not found'});
      } else {
        res.json(station);
      }
    }
    res.end();
  });
});

router.get('/find/:lng/:lat', function (req, res) {
  var lat = parseFloat(req.params.lat);
  var lng = parseFloat(req.params.lng);

  var nearPoint = {type: "Point", coordinates: [lng, lat] };
  console.log(nearPoint);

  Station.aggregate(
    [{ $geoNear: {
      near: nearPoint,
      distanceField: "dist.calculated",
      includeLocs: "dist.location",
      num: cfg.num_nearest_stations,
      spherical: true
    }
  }], function (err, result) {
    if (err) {
      console.log("error aggregating: " + err);
    } else {
      res.json(result);
      res.end();
    }
  });
});

app.use('/station', router);

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
