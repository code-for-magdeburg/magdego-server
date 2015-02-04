var request = require('request');
var async = require('async');
var _ = require('lodash');
var InsaAdapter = require('../../adapters/insaAdapter');


var timeTables;


//station names have format 'City, Station'. We only need Station.
var getFormattedStationName = function(stationName) {
  var indexKomma = stationName.indexOf(',');
  if(indexKomma === -1) indexKomma = -2;
  return stationName.slice(indexKomma + 2, stationName.length);
};


var retrieveJourneyInformation = function(res) {
  if( !res.hasOwnProperty('journey') ) {
    return;
  }

  var timeTable = [];

  _.forEach(res.journey, function(journey) {
    if(!_.isUndefined(journey.rt.dlt)) journey.da = journey.rt.dlt; 
    var date = journey.da.split('.').reverse();
    date[0] = '20' + date[0];
    if(date.length !== 3) date = [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
    console.log(date);
    timeTableEntry = {
      line: journey.pr,
      departure: new Date(date + ' ' + journey.ti).toJSON(),
      direction: getFormattedStationName(journey.st)
    }
    if(journey.rt !== false) timeTableEntry.delay = {};
    if(!_.isUndefined(journey.rt.dlm)) timeTableEntry.delay.minutes = journey.rt.dlm; 
    if(!_.isUndefined(journey.rt.status)) timeTableEntry.delay.status = journey.rt.status; 
    timeTable.push(timeTableEntry);

    if(timeTableEntry.departure === null) console.log(timeTableEntry.departure);
  });
  return timeTable;

}


var getJourneys = function(station) {
  return  InsaAdapter.requestJourneys(station.extId)
          .then(retrieveJourneyInformation)
}


var createTimeTables = function(stationData) {
  var promiseArray = [];
  timeTables = _.map(stationData.stops, function(station) {
    var timeTable = {};
    timeTable.station_info = getFormattedStationName(station.name);
    var journeyPromise = getJourneys(station);
    journeyPromise.then(function(val) {
      timeTable.departure_times = val;
    })
    promiseArray.push(journeyPromise);
    return timeTable;
  });

  return promiseArray;
}


var getTimetables = function(longitude, latitude) {
  return  InsaAdapter.requestStations(longitude, latitude)
          .then(createTimeTables).all()
          .then(function(arguments) {
            return timeTables;
          })
}


module.exports = {
  getTimetables: getTimetables
};