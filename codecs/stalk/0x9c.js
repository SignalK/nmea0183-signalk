/*
 * Copyright 2016 Joachim Bakke
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
 
var Codec = require('../../lib/NMEA0183');

module.exports = function(values, multiplexer, instrument) {
  /*Compass heading and turning direction*/
  var U = parseInt(values[1].charAt(0), 16);
  var VW = parseInt(values[2], 16);
  var RR = parseInt(values[3], 16);

  var compassHeading = (U & 0x3) * 90 + (VW & 0x3F) * 2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1) : 0);
  var rudderPos = RR;
  if(rudderPos > 127) {
    rudderPos = rudderPos - 256
  };


  var pathValues = []
  if(compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: Codec.prototype.transform(Codec.prototype.float(compassHeading), 'deg', 'rad')
    })
  }
  if(rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: Codec.prototype.transform(Codec.prototype.float(rudderPos), 'deg', 'rad')
    })
  }

  if(pathValues.length > 0) {
    multiplexer.add({
      "updates": [{
        "source": Codec.prototype.source(instrument),
        "timestamp": Codec.prototype.timestamp(),
        "values": pathValues
      }],
      "context": multiplexer._context
    });
  }
  return true
}
