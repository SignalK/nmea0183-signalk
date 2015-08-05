/* 
 * MWV codec
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 *
 *
 *
 * Copyright 2014, Fabian Tollenaar
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
=== MWV - Wind Speed and Angle ===

------------------------------------------------------------------------------
*******0   1 2   3 4
*******|   | |   | |
$--MWV,x.x,a,x.x,a*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

0. Wind Angle, 0 to 360 degrees
1. Reference, R = Relative, T = True
2. Wind Speed
3. Wind Speed Units, K = km/h, M = m/s, N = knots
4. Status, A = Data Valid
5. Checksum
*/

var Codec = require('../lib/NMEA0183');

function convertToWindAngle(self, angle) {
        var numAngle = self.float(angle) % 360;
        if (numAngle > 180 && numAngle <= 360) {
                return numAngle - 360;
        }
        return numAngle;
}

module.exports = new Codec('MWV', function(multiplexer, input) {
  var values = input.values;
  
  if(!values[4] || values[4].toUpperCase() != 'A') {
		// Don't parse this sentence as it's void/has no data, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void."); 
		return null;
	}

	var ts 		  = this.timestamp();
	var source 	= this.source();
	var wsu 	  = values[3].toUpperCase();

	if(wsu == 'K') {
		wsu = 'kph';
	} else if(wsu == 'N') {
		wsu = 'knots';
	} else { // M
		wsu = 'ms';
	}

  var angle = convertToWindAngle(this, values[0]);
  var speed = this.transform(values[2], wsu, 'ms');

  multiplexer.self();

  var valueType = values[1].toUpperCase() == "R" ? 'Apparent' : 'True';
  multiplexer.add({
    "updates": [{
      "source": source,
      "timestamp": ts,
      "values": [{
        "path": "environment.wind.speed" + valueType,
        "value": speed
      }, {
        "path": "environment.wind.angle" + valueType,
        "value": angle
      }]
    }],
    "context": multiplexer._context
  });
	return true;
});