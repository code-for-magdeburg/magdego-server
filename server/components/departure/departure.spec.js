var Departure = require('./index');
var should = require('chai').should();
var _ = require('lodash');

describe('----Test main function----', function () {

	it('getTimetables', function (done) {
		this.timeout(3000);
		Departure.getTimetables('11.6289', '52.1308')
			.then(function(stuff) {
				console.log(stuff[0]);
				done();
			})
			.fail(done);
	});

});