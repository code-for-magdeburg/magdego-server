var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var glob = require('glob');


var mocha = new Mocha;

var files = glob.sync('server/**/*.spec.js');

files.forEach(function(file){
    mocha.addFile(
        path.join(file)
    );
});

mocha.run(function(failures){
  process.on('exit', function () {
    process.exit(failures);
  });
});