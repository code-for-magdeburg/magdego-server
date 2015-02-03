var InsaAdapter = require('./index');
var expect = require('chai').expect;
var _ = require('lodash');

describe('----Test insaAdapter----', function () {

	var validExtIdOfStation = '7393';

	var assertStations = function(responseBody) {
		expect(responseBody.stops).to.exist();
		_.forEach(responseBody.stops, function(station) {
			expect(station.x).to.be.a('string').and.ok();
			expect(station.y).to.be.a('string').and.ok();
			expect(station.name).to.be.a('string').and.ok();
			expect(station.urlname).to.be.a('string').and.ok();
			expect(station.prodclass).to.be.a('string').and.ok();
			expect(station.extId).to.be.a('string').and.ok();
			expect(station.puic).to.be.a('string').and.ok();
			expect(station.dist).to.be.a('string').and.ok();
			expect(station.planId).to.be.a('string').and.ok();
		});
	};

	var assertJourneys = function(responseBody) {
		expect(responseBody.journey).to.exist();
		_.forEach(responseBody.journey, function(journey) {
			expect(journey.lfn).to.be.a('string').and.ok();
			expect(journey.id).to.be.a('string').and.ok();
			expect(journey.ti).to.be.a('string').and.ok();
			expect(journey.da).to.be.a('string').and.ok();
			expect(journey.ic).to.be.a('string').and.ok();
			expect(journey.pr).to.be.a('string').and.ok();
			expect(journey.st).to.be.a('string').and.ok();
			expect(journey.tr).to.be.a('string');
			expect(journey.rt).to.be.a('boolean');
			expect(journey.tinfo).to.be.a('string').and.ok();
			expect(journey.tinfoline).to.be.a('string').and.ok();
		});
	}

	it('requestStations', function (done) {
	    InsaAdapter.requestStations('11.6289', '52.1308')
	    	.then(assertStations)
	    	.then(done)
	    	.fail(done);
	});

	it('requestJourneys', function (done) {
	    InsaAdapter.requestJourneys(validExtIdOfStation)
	    	.then(assertJourneys)
	    	.then(done)
	    	.fail(done);
	});
});