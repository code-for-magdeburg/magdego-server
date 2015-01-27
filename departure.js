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

var QUERY_PATH = 'http://reiseauskunft.insa.de/bin/query.exe/dny?performLocating=2&tpl=stop2json&look_maxno=20';

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

  request(path, {encoding: null},
    function (err, resp, body) {
      if (err) {
        callback(err, null);
      } else {

        var jsonBody = JSON.parse(body);
        var stations = jsonBody.stops;

        var stationsWithId = [];

        for(i = 0; i < stations.length; i++) {

          // Filter out stations for IC/RB/RE/S-Bahn/U-Bahn
          if ( parseInt(stations[i].prodclass) > 31 ) {
            stationsWithId.push( {id: stations[i].extId, name: stations[i].name} );
          }
        }

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
// productFilter= masking out ICE/IC/RE/RB/S/U

var QUERY_JOURNEYS_PATH = 'http://reiseauskunft.insa.de/bin/stboard.exe/dn?L=.vs_stb&L=.vs_stb.vs_stb&boardType=dep&selectDate=today&productsFilter=0000011111&additionalTime=0&start=yes&requestType=0&outputMode=undefined&maxJourneys=30';

var get_journeys = function (station, callback) {

  var id = station.id;
  var name = station.name;

  // building path with parameters
  var current_date = new Date();
  var string_date = current_date.getHours() + ':' + current_date.getMinutes();

  var path = QUERY_JOURNEYS_PATH + '&input='+ id + '&time=' + string_date;

  // console.log('Path of Request');

  request(path, {encoding: null}, function (err, resp, body) {
    if (err) {
      callback(err, null);
    } else {

      // parse to string so we can work on it
      var bodyString = body.toString('utf-8');

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
        for ( i = 0; i < journeys.length; i++ ) {
          var row = journeys[i];

          // taking care of wrongly inserted journeys
          if ( row.pr !== "" && row.st !== "" && row.ti !== "" ) {

            var obj = {
              "line": row.pr,
              "direction": row.st,
              "departure": row.ti
            };

            if (! row.rt === false) {
              obj['delay'] = {"minutes": row.rt.dlm, "departure": row.rt.dlt, "status": row.rt.status};
            }

            times.push( obj );
          }
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
