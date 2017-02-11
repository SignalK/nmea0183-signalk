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

var Codec = require('../lib/NMEA0183');
var Decoder = require("ggencoder").AisDecode;

/*
A QUICK HACK THAT WILL NOT WORK WITH MULTIPLE
AIS NMEA STREAMS. Implements ggencoder session
as a global singleton. Proper implementation would be
a per stream constructer NMEA0183 encoder that would be able
to keep a coherent internal parsing state.
*/

module.exports = new Codec('VDM', function(multiplexer, input, line) {
  var data = new Decoder(line, multiplexer.aisSession);

  if (!data.valid) {
    return this.reportError(this.errors.VOID, "Not parsing sentence for it isn't valid.");
  }


  var values = [];
  if (data.mmsi) {
    values.push({
      path: "",
      value: {
        mmsi: data.mmsi
      }
    })
  }
  if (data.shipname) {
    values.push({
      path: "",
      value: {
        name: data.shipname
      }
    })
  }
  if (typeof data.sog != 'undefined') {
    values.push({
      path: "navigation.speedOverGround",
      value: this.transform(data.sog, 'knots', 'ms')
    })
  }
  if (typeof data.cog != 'undefined') {
    values.push({
      path: "navigation.courseOverGroundTrue",
      value: this.transform(data.cog, 'deg', 'rad')
    })
  }
  if (typeof data.hdg != 'undefined') {
    values.push({
      path: "navigation.headingTrue",
      value: this.transform(data.hdg, 'deg', 'rad')
    })
  }
  if (data.lon && data.lat) {
    values.push({
      path: "navigation.position",
      value: {
        longitude: data.lon,
        latitude: data.lat
      }
    })
  }

  if (values.length > 0) {
    multiplexer.self();
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": values
      }],
      "context": 'vessels.urn:mrn:imo:mmsi:' + data.mmsi
    });
  }

  return true;
});
