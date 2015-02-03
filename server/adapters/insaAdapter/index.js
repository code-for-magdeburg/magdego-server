var request = require('request');
var Q = require('q');
var _ = require('lodash');
var constants = require('../../../constants');
var QUERY_STATIONS_PATH_BASE = constants.QUERY_STATIONS_PATH_BASE;
var QUERY_JOURNEYS_PATH_BASE = constants.QUERY_JOURNEYS_PATH_BASE;


var getFormatedCoordinate = function(coordinate) {
  var formattedCoordinate = coordinate.replace('.', '');
	while ( formattedCoordinate.length < 8 ) {
    formattedCoordinate += '0';
  }
	return formattedCoordinate.substring(0, 8);
};


var getStaionsQueryPath = function(longitude, latitude) {
  var formattedLongitude = getFormatedCoordinate(longitude);
  var formattedLatitude = getFormatedCoordinate(latitude);

  return QUERY_STATIONS_PATH_BASE + '&look_x=' + formattedLongitude + '&look_y=' + formattedLatitude;
};


var decodeHtmlEntity = function(str) {
  return str.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
};


var parseHtmlBodyToJSON = function(body) {
  var bodyString = body.toString('utf-8');
  var bodyStringDecoded = decodeHtmlEntity(bodyString).replace('journeysObj = ','');
  return JSON.parse(bodyStringDecoded);
};


var getJourneysQueryPath = function(stationID) {
  var currentDate = new Date();
  var formattedDate = currentDate.getHours() + ':' + currentDate.getMinutes();

  return QUERY_JOURNEYS_PATH_BASE + '&input='+ stationID + '&time=' + formattedDate;
};


var sendRequest = function(path) {
	var deffered = Q.defer();

	request(path, {encoding: null}, function(err, resp, body) {
		if(err){
			deffered.reject(err);
		} else {
			deffered.resolve(body);
		}
	});

	return deffered.promise;
}


var requestJourneys = function(stationID) {
	var queryPath = getJourneysQueryPath(stationID);
	return sendRequest(queryPath).then(parseHtmlBodyToJSON);
};


var requestStations = function(longitude, latitude) {
	var queryPath = getStaionsQueryPath(longitude, latitude);
	return sendRequest(queryPath).then(JSON.parse);
};


module.exports = {
	requestStations: requestStations,
	requestJourneys: requestJourneys
}