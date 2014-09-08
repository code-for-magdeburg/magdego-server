var app = require('../app');
var http = require('http');
var assert = require('assert');

describe('server', function () {
  before(function () {
    app.boot(3000);
  });

  describe('/station/-42', function () {
    it('should return 404', function (done) {
      http.get("http://localhost:3000/station/-42", function (res) {
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

  after(function () {
    app.shutdown();
  })
});
