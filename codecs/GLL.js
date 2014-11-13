/* 
 * GLL codec
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
=== GLL - Geographic Position - Latitude/Longitude ===

------------------------------------------------------------------------------
        0       1 2        3 4         5 6   
        |       | |        | |         | |   
 $--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,a,m,*hh<CR><LF>
------------------------------------------------------------------------------

Field Number: 

0. Latitude
1. N or S (North or South)
2. Longitude
3. E or W (East or West)
4. Universal Time Coordinated (UTC)
5. Status A - Data Valid, V - Data Invalid
6. FAA mode indicator (NMEA 2.3 and later)
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('GLL', function(input) {
  var values = input.values;

	if(values[5].toUpperCase() == 'V') {
		// Don't parse this sentence as it's void, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void."); 
		return null;
	}

	if(typeof values[6] !== 'undefined' && values[6] !== null) {
		var mode = values[6].toUpperCase();
		
		if(mode != 'A' && mode != 'D') {
			// Mode is either E(stimated), N(ot valid) or S(imulated).
			this.reportError(this.errors.VOID_MODE, "NMEA 2.3 mode flag is " + mode + ". Aborting."); 
			return null;
		}
	}

	var time = values[4];

	if(time.indexOf('.') !== -1) {
		time = time.split('.')[0];
	}

	var ts 	 = this.timestamp(time);
	var self = this;

	var data = this.signal.navigation({
		position: {
			latitude: self.coordinate(values[0], values[1]),
			longitude: self.coordinate(values[2], values[3]),
			altitude: 0.0,
			source: self.source(), 
			timestamp: ts
		}
	});

	return data;
});



