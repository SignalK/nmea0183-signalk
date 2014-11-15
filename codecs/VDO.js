"use strict";

var Codec   = require('../lib/NMEA0183');
var Decoder = require ("ggencoder").AisDecode;

module.exports = new Codec('VDO', function(input, line) {
  var data = new Decoder(line);

  if(!data.valid) {
    return this.reportError(this.errors.VOID, "Not parsing sentence for it isn't valid."); 
  }

  var normalised = {
    channel: data.channel,
    class: data.class,
    aistype: data.aistype,
    mmsi: data.mmsi,
    status: data.navstatus,
    longitude: data.lon,
    latitude: data.lat,
    speedOverGround: data.sog,
    courseOverGround: data.cog,
    hdg: data.hdg,
    utc: data.utc
  }

  console.log('VDO', normalised);
  console.log("\n\n");

  // @TODO
});