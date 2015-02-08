var fs      = require('fs');
var path    = require('path');
var Parser  = require('../..').Parser;
var parser  = new Parser();

fs.createReadStream(path.join(__dirname, './ais.nmea'), { encoding: 'utf8' }).pipe(parser);

parser.on('sentence', function(signalk, lineno) {
  console.log(JSON.stringify(signalk, null, 2));
  console.log("\n\n");
});

parser.on('end', function() {
  console.log("---------------- END ----------------");
  process.exit();
});