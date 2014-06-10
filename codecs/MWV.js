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
3. Wind Speed Units, K(nots)/M(iles/hour)/N(m/s)
4. Status, A = Data Valid
5. Checksum
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('MWV', function(values, vessel) {

	if(values[4].toUpperCase() != 'A') {
		// Don't parse this sentence as it's void, but report the exception to the main Codec.
		this.reportError(this.errors.VOID, "Not parsing sentence for it's void."); 
		return null;
	}

	var data 	= {};
	var ts 		= this.timestamp();
	var source 	= this.source();
	var wsu 	= values[3].toUpperCase();

	if(wsu == 'K') {
		wsu = 'knots';
	} else if(wsu == 'M') {
		wsu = 'mph';
	} else {
		wsu = 'ms';
	}

	if(values[1].toUpperCase() == "R") {
		data['directionApparent'] = this.float(values[0]);
		data['speedApparent'] = this.transform(values[2], wsu, 'ms');
	} else {
		data['directionTrue'] = this.float(values[0]);
		data['speedTrue'] = this.transform(values[2], wsu, 'ms');
	}

	return this.signal.environmental({ wind: data });

});