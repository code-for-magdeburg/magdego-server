var Departure = require('../departure');
var should = require('chai').should();
var _ = require('lodash');

describe('----Test main function----', function () {

	it('getDepartureTimes should return object with valid station information', function (done) {
		this.timeout(3000);
	    Departure.getDepartureTimes('11.6289', '52.1308', function(err, res) {
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

	it.only('refactory', function (done) {
		this.timeout(3000);
		Departure.refactory('11.6289', '52.1308');
	    done();
	});

});