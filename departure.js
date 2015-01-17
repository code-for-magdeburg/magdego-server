var QUERY_PATH = 'http://reiseauskunft.insa.de/bin/query.exe/dny?performLocating=2&tpl=stop2json&look_maxno=20'

var request = require('request');
var async = require('async');

var get_departure_times = function (long, lat, callback) {

  // The geolocations are requiered in a specific format
  // without points and only 8 digits
  var formLat = lat.replace('.', '');

  while ( formLat.length < 8 ) {
    formLat += '0';
  }

  // cut of last 
  formLat = formLat.substring(0, 8);

  var formLong = long.replace('.', '');

  while (formLong.length < 8) {
    formLong += '0';
  }

  formLong = formLong.substring(0, 8);

  // Build path
  var path = QUERY_PATH + '&look_x=' + formLong + '&look_y=' + formLat;

  // console.log('Path of Request');
  // console.log(path);

  request(path, {encoding: null},
    function (err, resp, body) {
      if (err) {
        callback(err, null);
      } else {

        // console.log(body);
        
        var jsonBody = JSON.parse(body);
        var stations = jsonBody.stops;

        var stationsWithId = [];

        for(i = 0; i < stations.length; i++) {
          stationsWithId[i] = {id: stations[i].extId, name: stations[i].name};
        }

        // console.log('stations of Stations:');
        // console.log(stations);

        // look for journeys of each stations
        async.map(stationsWithId,
          // for each id
          get_journeys,
          // results saved here
          function(err, times){
            callback(null, times);
          }); 
      }
  });
};

// get journeys of one station

var QUERY_JOURNEYS_PATH = 'http://reiseauskunft.insa.de/bin/stboard.exe/dn?L=.vs_stb&L=.vs_stb.vs_stb&boardType=dep&selectDate=today&productsFilter=1111111111&additionalTime=0&start=yes&requestType=0&outputMode=undefined&maxJourneys=20'


var get_journeys = function (station, callback) {

  var id = station.id;
  var name = station.name;

  // building path with parameters
  var current_date = new Date();
  var string_date = current_date.getHours() + ':' + current_date.getMinutes();

  var path = QUERY_JOURNEYS_PATH + '&input='+ id + '&time=' + string_date;

  console.log('Path of Request');
  console.log(path);

  request(path, {encoding: null}, function (err, resp, body) {
    if (err) {
      callback(err, null);
    } else {

      // parse to string so we can work on it
      var bodyString = body.toString('utf-8');

      // console.log(bodyString);

      // FUCK THIS ENCODING SHIT
      bodyString = decodeHtmlEntity(bodyString);

      // remove the object in front of the json
      bodyString = bodyString.replace('journeysObj = ','');

      // get JSON object
      var jsonBody = JSON.parse(bodyString);

      times = [];

      // return if no journeys are present
      if( !jsonBody.hasOwnProperty('journey') )
      {
        callback(null, times);
      }
      else
      {
        var journeys = jsonBody.journey;
        for (i = 0; i < journeys.length; i++) {
          var row = journeys[i];

          times[i] = {
            "line": row.pr.replace(/\s+/g, ' '),
            "direction": row.st,
            "departure": row.ti    
          };
        }

        callback(null, { station_info: name, departure_times: times });
      }
    }
  });
};

var decodeHtmlEntity = function(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
};

exports.get_departure_times = get_departure_times;
