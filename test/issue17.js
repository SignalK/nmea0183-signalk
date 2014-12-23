var Parser  = require('../').parse;
var assert  = require('assert');

function clearTimestampFromObj(obj) {
  var out = {};

  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      if(typeof obj[prop] === 'object' && obj[prop] !== null) {
        out[prop] = clearTimestampFromObj(obj[prop]);
      } else {
        if(prop !== 'timestamp') {
          out[prop] = obj[prop];
        }
      }
    }
  }

  return out;
}

Parser('$IIDBT,034.28,f,010.45,M,005.64,F*2B', function(_, sk) {
  try {
    assert.strictEqual(JSON.stringify(clearTimestampFromObj(sk)), '{"self":"1A77F355","version":1,"vessels":{"1A77F355":{"uuid":"1A77F355","environment":{"depth":{"belowTransducer":{"source":{"type":"NMEA0183","sentence":"DBT","device":"signalk-parser-nmea0183"},"value":10.45}}}}}}', "DBT");
    console.log("DBT test passed.");
  } catch(err) {
    console.log("DBT test failed.");
  } 
}, { selfType: 'uuid', selfId: '1A77F355' });

Parser('$IIMWV,318,T,07.61,N,A*2F', function(_, sk) {
  try {
    assert.strictEqual(JSON.stringify(clearTimestampFromObj(sk)), '{"self":"1A77F355","version":1,"vessels":{"1A77F355":{"uuid":"1A77F355","environment":{"wind":{"directionTrue":{"source":{"type":"NMEA0183","sentence":"MWV","device":"signalk-parser-nmea0183"},"value":318},"speedTrue":{"source":{"type":"NMEA0183","sentence":"MWV","device":"signalk-parser-nmea0183"},"value":7.61}}}}}}', "MWV");
    console.log("WMV test passed.");
  } catch(err) {
    console.log("WMV test failed.");
  }
}, { selfType: 'uuid', selfId: '1A77F355' });