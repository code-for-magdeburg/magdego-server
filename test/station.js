var server = require('../app');
var assert = require('assert');
var http = require('http');

describe('/station', function () {

  before(function () {
    server.listen(3000);
  });

  after(function() {
    server.close();
  });

  describe('/station/1', function () {
    it('should return 200', function (done) {
      http.get('http://localhost:3000/station/1', function (res) {
        assert.equal(200, res.statusCode);
        done();
      });
    });
  });

});
