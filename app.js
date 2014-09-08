var express = require('express');
var bodyParser = require('body-parser')
var http = require('http');

var app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;

db.on('error', function () {
  console.log('error: could not connect to db!');
});

db.once('open', function () {
  var stationSchema = mongoose.Schema({
    id: Number,
    name: String,
    location: {
      type: String,
      coordinates: [Number, Number]
    }
  });

  var Station = mongoose.model('Station', stationSchema);

  router.get('/:id', function (req, res) {
    Station.findOne({id: req.params.id}, function (err, station) {
      if (err) {
        res.status(500).json({error: 'internal error'});
      } else {
        res.json(station);
      }
      res.end();
    });
  });

  router.get('/find/:long/:lat', function (req, res) {
    var lat = parseFloat(req.params.lat);
    var long = parseFloat(req.params.long);

    var nearPoint = {type: "Point", coordinates: [long, lat] };
    console.log(nearPoint);

    Station.aggregate(
      [{ $geoNear: {
        near: nearPoint,
        distanceField: "dist.calculated",
        includeLocs: "dist.location",
        num: 5,
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
});

app.use('/station', router);

this.server = http.createServer(app);

exports.listen = function() {
  return this.server.listen.apply(this.server, arguments);
};

exports.close = function() {
  return this.server.close();
};
