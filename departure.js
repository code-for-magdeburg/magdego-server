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

var QUERY_PATH_BASE = 'http://reiseauskunft.insa.de/bin/query.exe/dny?performLocating=2&tpl=stop2json&look_maxno=20';
var QUERY_JOURNEYS_PATH_BASE = 'http://reiseauskunft.insa.de/bin/stboard.exe/dn?L=.vs_stb&L=.vs_stb.vs_stb&boardType=dep&selectDate=today&productsFilter=0000011111&additionalTime=0&start=yes&requestType=0&outputMode=undefined&maxJourneys=30';



var getFormatedCoordinate = function(coordinate) {
  // The geolocations are requiered in a specific format
  // without points and only 8 digits
  var formattedCoordinate = coordinate.replace('.', '');

  while ( formattedCoordinate.length < 8 ) {
    formattedCoordinate += '0';
  }

  // cut of last
  formattedCoordinate = formattedCoordinate.substring(0, 8);

  return formattedCoordinate;
};


var getQueryPath = function(longitude, latitude) {
  var formattedLongitude = getFormatedCoordinate(longitude);
  var formattedLatitude = getFormatedCoordinate(latitude);

  return QUERY_PATH_BASE + '&look_x=' + formattedLongitude + '&look_y=' + formattedLatitude;
};


var getRequestCallback = function(callback){
  return function (err, resp, body) {
      if (err) {
        callback(err, null);
      } else {
        try {
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
          async.map ( stationsWithId,
            // for each id
            getJourneys,
            // results saved here
            function(err, times){
              callback(null, times);
            });
        } catch (e) {
          callback(err, []); // return empty error
        }
      }
  };
};


var getDepartureTimes = function (long, lat, callback) {
  var path = getQueryPath(long, lat);

  //TODO-Moezalez refactor callbacks. Maybe Q Library?
  request(path, {encoding: null}, getRequestCallback(callback));
};


var getJourneyQueryPath = function(stationID) {
  var current_date = new Date();
  var string_date = current_date.getHours() + ':' + current_date.getMinutes();

  return QUERY_JOURNEYS_PATH_BASE + '&input='+ stationID + '&time=' + string_date;
}


var getJourneyRequestCallback = function(name, callback) {
  return function (err, resp, body) {
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

            // INSA format of Date
            var insaDate = row.ti;

            var obj = {
              "line": row.pr,
              "direction": removeCityNames(row.st),
            };

            if (! row.rt === false) {
              obj['delay'] = {};

              if ( row.rt.dlm != null) {
                obj['delay']['minutes'] = row.rt.dlm;
              }

              if ( row.rt.status != null) {
                obj['delay']['status'] = row.rt.status;
              }

              // override original departure
              if ( row.rt.dlt != null) {
                insaDate = row.rt.dlt;
              }
            }

            // convert to Date
            var currentDate = new Date();
            var departureDate = new Date();
            var splittedDateInput = insaDate.split(':');

            departureDate.setMinutes(parseInt(splittedDateInput[1]));
            departureDate.setHours(parseInt(splittedDateInput[0]));

            if ( departureDate < currentDate ) {
              departureDate.setDate(departureDate.getDate() + 1); // increment by one day
            }

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


// get journeys of one station
// productFilter= masking out ICE/IC/RE/RB/S/U
var getJourneys = function (station, callback) {
  var name = removeCityNames(station.name);
  var path = getJourneyQueryPath(station.id);

  request(path, {encoding: null}, getJourneyRequestCallback(name, callback));
};

var decodeHtmlEntity = function(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
};

var removeCityNames = function(str) {
  return str.replace('Magdeburg, ','').replace('Halle (Saale), ', '').replace('Leipzig, ','');
};

exports.get_departure_times = getDepartureTimes;
