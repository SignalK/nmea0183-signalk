/* 
 * DBT codec
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
=== DBT - Depth below transducer ===

------------------------------------------------------------------------------
*******0   1 2   3 4   5 6
*******|   | |   | |   | |
$--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

0. Depth, feet
1. f = feet
2. Depth, meters
3. M = meters
4. Depth, Fathoms
5. F = Fathoms
6. Checksum

Needs a vessel object for input. Need to know:
- Distance between transducer to end of keel in M
- Distance between waterline and transducer transducer in M
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('DBT', function(values, vessel) {
	var ts 	 = this.timestamp();
	var data = {
		depthBelowTransducer: {
			source: this.source(),
			timestamp: ts,
			value: this.float(values[2])
		}
	};

	if(typeof vessel === 'object' && vessel !== null && vessel.dimensions !== null && typeof vessel.dimensions === 'object' && typeof vessel.dimensions.depthTransducer === 'number') {
		data.depth = {
			source: this.source(),
			timestamp: ts,
			value: (this.float(values[2]) + vessel.dimensions.depthTransducer)
		};

		if(typeof vessel.dimensions.keel === 'number') {
			data.depthBelowKeel = {
				source: this.source(),
				timestamp: ts,
				value: (this.float(values[2]) - (vessel.dimensions.keel - vessel.dimensions.depthTransducer))
			};
		}
	}

	return this.signal.environmental(data);
});