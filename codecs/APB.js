/*
 * Copyright 2015 Fabian Tollenaar <fabian@starting-point.nl>
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



/* 
 * ABT codec
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Fabian Tollenaar <fabian@starting-point.nl>
 *
 */

"use strict";

/*
	   0 1 2    3 4 5 6 7   8 9    10 11  12 13
	   | | |    | | | | |   | |    |   |  |  |
$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C 

where:
			APB     	Autopilot format B
0 			A       	Loran-C blink/SNR warning, general warning 
1 			A       	Loran-C cycle warning 
2 			0.10   		cross-track error distance 
3 			R       	steer Right to correct (or L for Left) 
4 			N       	cross-track error units - nautical miles (K for kilometers) 
5 			V       	arrival alarm - circle 
6 			V       	arrival alarm - perpendicular 
7,8 		011,M   	magnetic bearing, origin to destination 
9 			DEST    	destination waypoint ID 
10,11 		011,M   	magnetic bearing, present position to destination 
12,13 		011,M   	magnetic heading to steer (bearings could True as 033,T) 
			*3C			Checksum
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('APB', function(multiplexer, input) {
  var values = input.values;

	if(values[0].toUpperCase() == 'V') {
		// Don't parse this sentence as it's void, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void (LORAN-C blink/SNR warning)."); 
		return null;
	}

	if(values[1].toUpperCase() == 'V') {
		// Don't parse this sentence as it's void, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void (LORAN-C cycle warning)."); 
		return null;
	}

	var xte = this.transform(values[2], (values[4].toUpperCase() === 'N' ? 'nm' : 'km'), 'nm'); // value, inputFormat, outputFormat

	multiplexer
    .self()
    .group('navigation')
    .set('currentRoute', {
      source: this.source(),
      timestamp: this.timestamp(),
      steer: (values[3].toUpperCase() == 'R' ? 'right' : 'left'),
      bearingActual: this.float(values[10]),
      bearingDirect: this.float(values[7]),
      courseRequired: this.float(values[12]),
      waypoint: {
        next: values[9],
        xte: xte
      }
    })
  ;

	return true;
});