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

var request = require('request');
var async = require('async');
var _ = require('lodash');

var QUERY_PATH_BASE = 'http://reiseauskunft.insa.de/bin/query.exe/dny?performLocating=2&tpl=stop2json&look_maxno=20';
var QUERY_JOURNEYS_PATH_BASE = 'http://reiseauskunft.insa.de/bin/stboard.exe/dn?L=.vs_stb&L=.vs_stb.vs_stb&boardType=dep&selectDate=today&productsFilter=0000011111&additionalTime=0&start=yes&requestType=0&outputMode=undefined&maxJourneys=30';


var decodeHtmlEntity = function(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
};


var removeCityNames = function(str) {
  return str.replace('Magdeburg, ','').replace('Halle (Saale), ', '').replace('Leipzig, ','');
};


var parseHtmlBodyToJSON = function(body) {
  var bodyString = body.toString('utf-8');
  var bodyStringDecoded = decodeHtmlEntity(bodyString).replace('journeysObj = ','');

  return JSON.parse(bodyStringDecoded);
};


var getDateFromInsaDate = function(insaDate) {
  var currentDate = new Date();
  var departureDate = new Date();
  var splittedDateInput = insaDate.split(':');

  departureDate.setMinutes(parseInt(splittedDateInput[1]));
  departureDate.setHours(parseInt(splittedDateInput[0]));

  if ( departureDate < currentDate ) {
    departureDate.setDate(departureDate.getDate() + 1); // increment by one day
  }

  return departureDate;
};


//TODO refactor
var getJourneyRequestCallback = function(name, callback) {
  return function (err, resp, body) {
    if (err) {
      callback(err, null);

    } else {

      var bodyJSON = parseHtmlBodyToJSON(body);
      var times = [];

      // return if no journeys are present
      if( !bodyJSON.hasOwnProperty('journey') ) {
        callback();

      } else {
        var journeys = bodyJSON.journey;

        for ( i = 0; i < journeys.length; i++ ) {
          var curRow = journeys[i];

          // taking care of wrongly inserted journeys
          if ( curRow.pr !== "" && curRow.st !== "" && curRow.ti !== "" ) {

            // INSA format of Date
            var insaDate = curRow.ti;

            var obj = {
              "line": curRow.pr,
              "direction": removeCityNames(curRow.st),
            };

            //FIX Confusing use of '!'.
            if (! curRow.rt === false) {
              obj['delay'] = {};

              if ( curRow.rt.dlm != null) {
                obj['delay']['minutes'] = curRow.rt.dlm;
              }

              if ( curRow.rt.status != null) {
                obj['delay']['status'] = curRow.rt.status;
              }

              // override original departure
              if ( curRow.rt.dlt != null) {
                insaDate = curRow.rt.dlt;
              }
            }

            var departureDate = getDateFromInsaDate(insaDate);
            obj['departure'] = departureDate.toJSON();
            times.push( obj );
          }
        }

        // Sorting because INSA don't provide it sorted
        // Compare on Dates
        times.sort(function(a, b) {
          return a.departure.localeCompare(b.departure);
        });

        callback(null, { station_info: name, departure_times: times });
      }
    }
  };
};


var getJourneyQueryPath = function(stationID) {
  var current_date = new Date();
  var string_date = current_date.getHours() + ':' + current_date.getMinutes();

  return QUERY_JOURNEYS_PATH_BASE + '&input='+ stationID + '&time=' + string_date;
};


// get journeys of one station
// productFilter= masking out ICE/IC/RE/RB/S/U
var getJourneys = function (station, callback) {
  var name = removeCityNames(station.name);
  var path = getJourneyQueryPath(station.id);

  //TODO refactor callbacks. Maybe Q Library?
  request(path, {encoding: null}, getJourneyRequestCallback(name, callback));
};


var getFormatedCoordinate = function(coordinate) {
  // The geolocations are requiered in a specific format
  // without points and only 8 digits
  var formattedCoordinate = coordinate.replace('.', '');

  while ( formattedCoordinate.length < 8 ) {
    formattedCoordinate += '0';
  }

  formattedCoordinate = formattedCoordinate.substring(0, 8);

  return formattedCoordinate;
};


// Filter out stations for IC/RB/RE/S-Bahn/U-Bahn
var getFilteredStations = function(stations) {
  var stationsWithId = [];

  for(i = 0; i < stations.length; i++) {
    if ( parseInt(stations[i].prodclass) > 31 ) {
      stationsWithId.push( {id: stations[i].extId, name: stations[i].name} );
    }
  }

  return stationsWithId;
};


var getRequestCallback = function(callback){
  return function (err, resp, body) {

      if (err) {
        callback(err, null);

      } else {
        try {
          var bodyJSON = JSON.parse(body);
          var stations = bodyJSON.stops;
          var stationsWithId = getFilteredStations(stations);

          // look for journeys of each stations
          async.map ( stationsWithId,
            // for each id
            getJourneys,
            // results saved here
            function(err, times){
              _.pull(times, undefined);
              callback(null, times);
            });
        } catch (e) {
          callback(err, []); // return empty error
        }
      }
  };
};


var getQueryPath = function(longitude, latitude) {
  var formattedLongitude = getFormatedCoordinate(longitude);
  var formattedLatitude = getFormatedCoordinate(latitude);

  return QUERY_PATH_BASE + '&look_x=' + formattedLongitude + '&look_y=' + formattedLatitude;
};


var getDepartureTimes = function (long, lat, callback) {
  var path = getQueryPath(long, lat);

  //TODO refactor callbacks. Maybe Q Library?
  request(path, {encoding: null}, getRequestCallback(callback));
};


module.exports = {
  getDepartureTimes: getDepartureTimes
};
