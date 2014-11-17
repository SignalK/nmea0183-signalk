"use strict";

var Codec   = require('../lib/NMEA0183');
var Decoder = require ("ggencoder").AisDecode;

module.exports = new Codec('VDM', function(multiplexer, input, line) {
  var data = new Decoder(line);

  if(!data.valid) {
    return this.reportError(this.errors.VOID, "Not parsing sentence for it isn't valid."); 
  }

  // console.log(JSON.stringify(data, null, 2));
  // console.log('\n');

  // MMSI
  multiplexer.vessel(data.mmsi).set('mmsi', data.mmsi);

  // Position
  multiplexer
    .vessel(data.mmsi)
    .group('navigation')
    .set('position', {
      source: this.source(),
      timestamp: this.timestamp(),
      longitude: data.lon,
      latitude: data.lat
    })
  ;

  // Other values
  multiplexer
    .vessel(data.mmsi)
    .group('navigation')
    .timestamp(this.timestamp())
    .source(this.source())
    .values([
      { path: "speedOverGround", value: data.sog },
      { path: "courseOverGround", value: data.cog },
      { path: "state", value: data.GetNavStatus() },
      { path: "headingTrue", value: data.hdg }
    ])
  ;

  return true;
});