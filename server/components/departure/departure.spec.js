var Departure = require('./index');
var should = require('chai').should();
var _ = require('lodash');

describe('----Test main function----', function () {

	it('refactory', function (done) {
		this.timeout(3000);
		Departure.refactory('11.6289', '52.1308');
	    done();
	});

});