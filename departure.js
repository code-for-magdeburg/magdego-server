var QUERY_MVB_PATH = 'http://www.movi.de/mvb/fgi2/index.php?send_request=yes&refnr_stationname=%s||| &day=%s&month=%s&year=%s&hour=%s&min=%s&nextTime=120'

var http = require('http');
var util = require('util');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');

var get_departure_times = function (id, callback) {
  var current_date = new Date();
  var path = util.format(QUERY_MVB_PATH,
    id,
    current_date.getDay(),
    current_date.getMonth(),
    current_date.getYear(),
    current_date.getHours(),
    current_date.getMinutes());

  http.get(path, function (res) {

    if (res == null) {
      callback("get request failed", null);
    }

    var convert_stream = iconv.decodeStream('ISO-8859-1');
    res.pipe(convert_stream);

    // get raw html
    var body = '';

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      var $ = cheerio.load(body);
      var row = $(".abfahrtszeiten tr:not(first-child)");
      var times = [];

      row.each(function (i, elem) {
        times[i] = {
          "line:": $(elem).find('.linie').text(),
          "direction": $(elem).find('.richtung').text(),
          "departure": $(elem).find('.abfahrtsoll').text()
        };
      });

      console.log(times);
    });
  });
};

exports.get_departure_times = get_departure_times;