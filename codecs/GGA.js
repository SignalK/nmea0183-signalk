/* 
 * GGA codec
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
=== GGA - Global Positioning System Fix Data ===

Time, Position and fix related data for a GPS receiver.

------------------------------------------------------------------------------
                                                      11
        1         2       3 4        5 6 7  8   9  10 |  12 13  14   15
        |         |       | |        | | |  |   |   | |   | |   |    |
 $--GGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh<CR><LF>
------------------------------------------------------------------------------

Field Number: 

0. Universal Time Coordinated (UTC)
1. Latitude
2. N or S (North or South)
3. Longitude
4. E or W (East or West)
5. GPS Quality Indicator,
     - 0 - fix not available,
     - 1 - GPS fix,
     - 2 - Differential GPS fix
           (values above 2 are 2.3 features)
     - 3 = PPS fix
     - 4 = Real Time Kinematic
     - 5 = Float RTK
     - 6 = estimated (dead reckoning)
     - 7 = Manual input mode
     - 8 = Simulation mode
6. Number of satellites in view, 00 - 12
7. Horizontal Dilution of precision (meters)
8. Antenna Altitude above/below mean-sea-level (geoid) (in meters)
9. Units of antenna altitude, meters
10. Geoidal separation, the difference between the WGS-84 earth
     ellipsoid and mean-sea-level (geoid), "-" means mean-sea-level
     below ellipsoid
11. Units of geoidal separation, meters
12. Age of differential GPS data, time in seconds since last SC104
     type 1 or 9 update, null field when DGPS is not used
13. Differential reference station ID, 0000-1023
14. Checksum
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('GGA', function(input) {
  var values = input.values;
	var ts     = this.timestamp();
  
	var data = this.signal.navigation({
		gnss: {
			source: this.source(),
			timestamp: this.timestamp(values[0]),
			quality: this.int(values[5]),
			satellites: this.int(values[6]),
			antennaAltitude: this.int(values[8]),
			horizontalDilution: this.int(values[7]),
			geoidalSeparation: this.int(values[10]),
			differentialAge: this.int(values[12]),
			differentialReference: this.int(values[13])
		},

		position: {
			source: this.source(),
			timestamp: this.timestamp(values[0]),
			latitude: this.coordinate(values[1], values[2]),
			longitude: this.coordinate(values[3], values[4]),
			altitude: 0.0
		}
	});

	return data;
});