/*
 **
 *
 * Copyright 2017, Teppo Kurki
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict";

/*
       0   1   2 3   4 5
       |   |   | |   | |
$--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>
Field Number:
0 Magnetic Sensor heading in degrees
1 Magnetic Deviation, degrees
2 Magnetic Deviation direction, E = Easterly, W = Westerly
3 Magnetic Variation degrees
4 Magnetic Variation direction, E = Easterly, W = Westerly
5 Checksum
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('HDG', function(multiplexer, input) {
  var values = input.values;

  multiplexer.self();

  var pathValues = []
  if (values[0]) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: this.transform(this.float(values[0]), 'deg', 'rad')
    })
  }

  if (values[3] && values[4]) {
    pathValues.push({
      path: 'navigation.magneticVariation',
      value: this.transform(this.float(values[3]), 'deg', 'rad') *
        (values[4] === 'E' ? 1 : -1)
    })
  }

  //TODO Deviation https://github.com/SignalK/specification/issues/242

  if (pathValues.length > 0) {
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": pathValues
      }],
      "context": multiplexer._context
    });
  }
  return true;

});
