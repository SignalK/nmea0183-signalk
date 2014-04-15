"use strict";

/*
=== BWC - Bearing & Distance to Waypoint - Great Circle ===
------------------------------------------------------------------------------
                                                     11
    0         1       2 3        4 5   6 7   8 9   10|    12 13
    |         |       | |        | |   | |   | |   | |    |   |
$--BEC,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x.x,T,x.x,M,x.x,N,c--c,m,*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. UTCTime
1. Waypoint Latitude
2. N = North, S = South
3. Waypoint Longitude
4. E = East, W = West
5. Bearing, True
6. T = True
7. Bearing, Magnetic
8. M = Magnetic
9. Nautical Miles
10. N = Nautical Miles
11. Waypoint ID
12. FAA mode indicator (NMEA 2.3 and later, optional)
13. Checksum

@FIXME this codec needs to be done but spec is vague on this. 
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('BWC', function(values) {

	 var ts = this.timestamp(values[0]);
	 var src = this.source();

	 var data = this.signal.navigation({
		currentRoute: {
			source: src,
			timestamp: ts,
			// steer: ,
			// bearingActual: ,
			// bearingDirect: ,
			// courseRequired: ,
			// arrivalAlarm: ,
			// eta: ,
			// route: ,
			// startTime: ,
			// waypointLastTime: ,
			// waypointLast: ,
			// waypointNextEta: ,
			waypointNext: ,
			// xte: 
		}
	});

});