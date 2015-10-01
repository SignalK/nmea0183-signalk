var debug = require('debug')('signalk-parser-nmea0183-test');
var TcpStream = require('./tcp/TcpStream');
var Parser = require('../index').Parser;

var tcp = new TcpStream({
  host: '127.0.0.1',
  port: 2947
});

var parser = new Parser;

parser.on('data', function(data) {
  debug(JSON.stringify(data, null, 2));
  console.log("\n");
});

tcp.pipe(parser);