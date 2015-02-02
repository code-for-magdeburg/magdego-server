var app = require('../app');
var Departure = require('../departure');
var http = require('http');
var assert = require('assert');
var should = require('chai').should();
var _ = require('lodash');


before(function () {
	app.boot(3000);
});

var validRequestString = 'http://localhost:3000/?long=11.6289&lat=52.1308';

describe.only('----Test main function----', function () {

	it('should return 200 when called with valid coordinates', function (done) {
	  http.get(validRequestString, function (res) {
	    assert.equal(res.statusCode, 200);
	    done();
	  });
	});

	it('get_departure_times should return object with valid station information', function (done) {
	  http.get(validRequestString, function (res) {
	    Departure.get_departure_times('11.6289', '52.1308', function(err, res) {
	    	if(err){
	    		done(err);
	    	}
	    	res.length.should.equal(18);
	    	_.forEach(res, function(station) {
	    		station.station_info.should.exist;
	    		station.departure_times.should.exist;

	    		var firstStop = station.departure_times[0];
	    		firstStop.should.exist;
	    		firstStop.line.should.exist;
	    		firstStop.direction.should.exist;
	    		firstStop.departure.should.exist;

	    	})
	    	done();
	    })
	  });
	});

});