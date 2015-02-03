var InsaAdapter = require('./index');
var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

describe('----Test insaAdapter----', function () {

	var validExtIdOfStation = '7393';

	var assertStations = function(responseBody) {
		expect(responseBody.stops).to.exist();
		var stations = responseBody.stops;
		_.forEach(stations, function(station) {
			expect(station.x).to.be.a('string').and.ok();
			expect(station.y).to.be.a('string').and.ok()
			expect(station.name).to.be.a('string').and.ok()
			expect(station.urlname).to.be.a('string').and.ok()
			expect(station.prodclass).to.be.a('string').and.ok()
			expect(station.extId).to.be.a('string').and.ok()
			expect(station.puic).to.be.a('string').and.ok()
			expect(station.dist).to.be.a('string').and.ok()
			expect(station.planId).to.be.a('string').and.ok()
		});
	}

	it('requestStations', function (done) {
	    InsaAdapter.requestStations('11.6289', '52.1308')
	    	.then(assertStations)
	    	.then(done)
	    	.fail(done);
	});

	it.only('requestJourneys', function (done) {
	    InsaAdapter.requestJourneys(validExtIdOfStation)
	    	.then(console.log)
	    	.then(done)
	    	.fail(done);
	});
});