/*
 * Copyright 2015 Fabian Tollenaar <fabian@starting-point.nl>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/


"use strict";

var Codec   = require('../lib/NMEA0183');
var Decoder = require ("ggencoder").AisDecode;

module.exports = new Codec('VDM', function(multiplexer, input, line) {
  var data = new Decoder(line);

  if(!data.valid) {
    return this.reportError(this.errors.VOID, "Not parsing sentence for it isn't valid."); 
  }

  // Set MRN with MMSI
  data.mmsi = 'urn:mrn:imo:mmsi:' + data.mmsi;
  // MMSI
  multiplexer.vessel(data.mmsi).set('mmsi', data.mmsi);

  // Position
  multiplexer
    .vessel(data.mmsi)
    .group('navigation')
    .set('position', {
      source: this.source(input.instrument),
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
    .source(this.source(input.instrument))
    .values([
      { path: "speedOverGround", value: this.transform(data.sog, 'knots', 'ms') },
      { path: "courseOverGround", value: this.transform(data.cog, 'deg', 'rad') },
      { path: "state", value: data.GetNavStatus() },
      { path: "headingTrue", value: this.transform(data.hdg, 'deg', 'rad') }
    ])
  ;

  return true;
});