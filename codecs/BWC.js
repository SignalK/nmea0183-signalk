/* 
 * BWC codec
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

BWC - Bearing & Distance to Waypoint - Geat Circle
                                                        11
       0         1       2 3        4 5   6 7   8 9  10 |    12 13
       |         |       | |        | |   | |   | |   | |    |   |
$--BEC,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x.x,T,x.x,M,x.x,N,c--c,m,*hh<CR><LF>

Field Number: 
0) UTCTime
1) Waypoint Latitude
2) N = North, S = South
3) Waypoint Longitude
4) E = East, W = West
5) Bearing, True
6) T = True
7) Bearing, Magnetic
8) M = Magnetic
9) Nautical Miles
10) N = Nautical Miles
11) Waypoint ID
12) FAA mode indicator (NMEA 2.3 and later, optional)
13) Checksum

Example 1: $GPBWC,081837,,,,,,T,,M,,N,*13
Example 2: GPBWC,220516,5130.02,N,00046.34,W,213.8,T,218.0,M,0004.6,N,EGLM*11

@TODO - Needs updating.???

*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('BWC', function(input) {
  var values     = input.values;
	var ts  		   = this.timestamp(values[0]); // Timestamp is only time - no date. Date is assumed today.
	var source 	   = this.source();
	var nav 		   = {};
	var rsrc		   = {};
	var overwrite  = false;
	
	rsrc.waypoints = {};

	if(typeof rsrc.waypoints[values[11]] === 'undefined' || rsrc.waypoints[values[11]] === null) {
		overwrite = true;
	} else {
		// Waypoint has same ID, but does it have the same coordinates?
		if(rsrc.waypoints[values[11]].position.longitude != this.coordinate(values[3], String(values[4]).toUpperCase()) || rsrc.waypoints[values[11]].position.latitude != this.coordinate(values[1], String(values[2]).toUpperCase())) {
			overwrite = true;
		}
	}

	if(overwrite === true) {
		rsrc.waypoints[values[11]] = {
			name: values[11],
			description: "",
			type: "location",
			timestamp: ts,
			source: source,
			position: {
				longitude: this.coordinate(values[3], String(values[4]).toUpperCase()),
				latitude: this.coordinate(values[1], String(values[2]).toUpperCase()),
				altitude: 0.0,
				source: source,
				timestamp: ts
			}
		};
	}

	nav.currentRoute = {
		source: source,
		timestamp: ts, 
		bearingActual: this.float(values[5]),
		waypoint: {
			next: values[11]
		}
	};

	return this.signal.multiple({ navigation: this.signal.navigation(nav) }, rsrc);

});