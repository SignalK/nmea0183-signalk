/*
* VWR codec
*
* @repository https://github.com/signalk/nmea-signalk
* @author Joachim Bakke, joabakk
*
*
* Copyright 2016, Joachim Bakke
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
VWR - Relative (Apparent) Wind Speed and Angle
        0  1  2  3  4  5  6  7 8
$--VWR,x.x,a,x.x,N,x.x,M,x.x,K*hh<CR><LF>
 0 - Measured wind angle relative to the vessel, 0 to 180 deg
 1 - a = L/R left or right of vessel heading
 2 - Measured wind Speed, knots
 3 - N = knots
 4 - Wind speed, meters/second
 5 - M = m/s
 6 - Wind speed, Km/Hr
 7 - K = km/h
 8 - Checksum
 */

var Codec = require('../lib/NMEA0183');

function hasValue(value) {
  return (typeof value !== 'undefined' && value !== '' && value !== null);
}

module.exports = new Codec('VWR', function(multiplexer, input) {
  var values = input.values;

  var rightPositive = 0;
  if (String(values[1]).toUpperCase() === 'R') {
    rightPositive = 1;
  }else if (String(values[1]).toUpperCase() === 'L') {
    rightPositive = -1;
  }

  var parsedValues = [];

  if(hasValue(values[0])) {
    parsedValues.push({ path: 'angleApparent', value: this.transform(this.float(values[0])*rightPositive, 'deg', 'rad') });
  }
  if(hasValue(values[2])) {
    parsedValues.push({ path: 'speedApparent', value: this.transform(this.float(values[2]), 'knots', 'ms') });
  }

  multiplexer
  .self()
  .group('environment.wind')
  .timestamp(this.timestamp())
  .source(this.source(input.instrument))
  .values(parsedValues);

  return true;
});
