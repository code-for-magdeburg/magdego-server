var QUERY_MVB_PATH = 'http://www.movi.de/mvb/fgi2/index.php?send_request=yes&refnr_stationname=%s||| &day=%s&month=%s&year=%s&hour=%s&min=%s&nextTime=120'

var request = require('request');
var util = require('util');
var cheerio = require('cheerio');
var iconv = require('iconv');

var get_departure_times = function (id, callback) {
  var current_date = new Date();
  var path = util.format(QUERY_MVB_PATH,
    id,
    current_date.getDay(),
    current_date.getMonth(),
    current_date.getYear(),
    current_date.getHours(),
    current_date.getMinutes());

  request(path, {encoding: null}, function (err, resp, body) {
    if (err) {
      callback(err, null);
    } else {
      var converter = iconv.Iconv('iso-8859-1', 'utf-8');
      var buf = converter.convert(body);
      body = buf.toString('utf-8');

      var $ = cheerio.load(body);
      var row = $(".abfahrtszeiten tbody tr:not(:first-child)");
      var times = [];

      row.each(function (i, elem) {
        var line = $(elem).find('.linie').text();
        var direction = $(elem).find('.richtung').text();
        var departure = $(elem).find('.abfahrtsoll').text();

        if (departure === '') {
          departure = $(elem).find('.abfahrtlive').text().slice(0,-1);
        }

        times[i] = {
          "line:": line,
          "direction": direction,
          "departure": departure
        };
      });

      callback(null, times);
    }
  });
};

exports.get_departure_times = get_departure_times;
