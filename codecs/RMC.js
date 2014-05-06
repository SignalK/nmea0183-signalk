/* 
 * RMC codec
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
RMC Sentence
http://www.gpsinformation.org/dale/nmea.htm#RMC

$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A

values:
 - 			RMC          Recommended Minimum sentence C
[0] 		123519       Fix taken at 12:35:19 UTC
[1] 		A            Status A=active or V=Void.
[2][3] 		4807.038,N   Latitude 48 deg 07.038' N
[4][5] 		01131.000,E  Longitude 11 deg 31.000' E
[6] 		022.4        Speed over the ground in knots
[7] 		084.4        Track angle in degrees True
[8] 		230394       Date - 23rd of March 1994
[9][10] 	003.1,W      Magnetic Variation
 - 			*6A          The checksum data, always begins with *
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('RMC', function(values) {
	
	if(values[1].toUpperCase() == 'V') {
		// Don't parse this sentence as it's void, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void."); 
		return null;
	}

	var time = values[0];
	var date = values[8];

	if(time.indexOf('.') !== -1) {
		time = time.split('.')[0];
	}

	var ts 	 = this.timestamp(time, date);
	var self = this;

	var data = {
		courseOverGroundTrue: {
			source:  self.source(),
			timestamp: ts,
			value: self.float(values[7])
		},

		location: {
			latitude: self.coordinate(values[2], values[3]),
			longitude: self.coordinate(values[4], values[5]),
			source:  self.source(), 
			timestamp: ts
		}, 

		magneticVariaton: {
			source:  self.source(),
			timestamp: ts,
			value: this.magneticVariaton(values[9], values[10]),
		},

		speedOverGround: {
			source:  self.source(),
			timestamp: ts,
			value: self.float(values[6])
		}
	};

	return this.signal.navigation(data);
});



