var request = require('request');
var constants = require('../../../constants');
var QUERY_STATIONS_PATH_BASE = constants.QUERY_STATIONS_PATH_BASE;
var QUERY_JOURNEYS_PATH_BASE = constants.QUERY_JOURNEYS_PATH_BASE;



var stationRequest = function(callback) {
	request(QUERY_STATIONS_PATH_BASE, {encoding: null}, callback);
};


module.exports = {
	stationRequest: stationRequest
}