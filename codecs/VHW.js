/*
 * VHW codec
 *
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Jukka Aittola <jaittola@iki.fi>
 *
 *
 *
 * Copyright 2015, Jukka Aittola
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
 *
 */

"use strict";

/*
=== VHW - Water speed and heading ===

------------------------------------------------------------------------------
        0   1 2   3 4   5 6   7 8
        |   | |   | |   | |   | |
 $--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh<CR><LF>
------------------------------------------------------------------------------

$IIVHW,,T,,M,06.14,N,11.37,K*52

Field Number:

0: Degress True
1: T = True
2: Degrees Magnetic
3: M = Magnetic
4: Knots (speed of vessel relative to the water)
5: N = Knots
6. Kilometers (speed of vessel relative to the water)
7. K = Kilometers
8. Checksum
*/

var Codec = require('../lib/NMEA0183');

function hasValue(value) {
  return (typeof value !== 'undefined' && value !== '' && value !== null);
}

module.exports = new Codec('VHW', function(multiplexer, input) {
  var values = input.values;

  var speed;
  var parsedValues = [];

  if(hasValue(values[0])) {
    parsedValues.push({ path: 'headingTrue', value: this.transform(this.float(values[0]), 'deg', 'rad') });
  }
  if(hasValue(values[2])) {
    parsedValues.push({ path: 'headingMagnetic', value: this.transform(this.float(values[2]), 'deg', 'rad') });
  }

  if(hasValue(values[6])) {
    speed = this.transform(values[6], 'kph', 'ms');
  } else if(hasValue(values[4])) {
    speed = this.transform(values[4], 'knots', 'ms');
  }

  if (typeof speed !== 'undefined') {
    parsedValues.push({ path: 'speedThroughWater', value: speed });
  }

  multiplexer
  .self()
  .group('navigation')
  .timestamp(this.timestamp())
  .source(this.source(input.instrument))
  .values(parsedValues);

  return true;
});
