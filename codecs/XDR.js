/*
 * Copyright 2016 Damian Hamill <damianham@gmail.com>
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
 * XDR codec
 * 
 * @repository 		https://github.com/signalk/nmea-signalk
 * @author 			Damian Hamill <damianham@gmail.com>
 *
 */

"use strict";

/*
XDR - Transducer Measurement
        0 1   2 3            n
        | |   | |            |
 $--XDR,a,x.x,a,c--c, ..... *hh<CR><LF>

where:

0. Transducer Type
1. Measurement Data
2. Units of measurement
3. Name of transducer

There may be any number of quadruplets like this, each describing a sensor. 
*/


var Codec = require('../lib/NMEA0183');
module.exports = new Codec('XDR', function(multiplexer, input) {
  var values = input.values;

	multiplexer.self();
	
	// loop through each quadruplet
	var updates = [];
	var i = 0;
	
	var data = values.slice(i,i+4);
	while (i < values.length && data.length > 2) {
		
		// generate a name for the transducer if no name exists using the type and index
		if (typeof data[3] === 'undefined' || data[3] === '') {
			data[3] = data[0] + i / 4;
		}
		
		updates.push({
      "source": this.source(input.instrument),
      "timestamp": this.timestamp(),
      "values": [{
        "path": "sensors."+data[3]+".name",
        "value": data[3]
      },
			{
        "path": "sensors."+data[3]+".sensorType",
        "value": data[0]
      },
			{
        "path": "sensors."+data[3]+".sensorData",
        "value": data[1]  // TODO convert the sensor data to standard unit based on sensor type, data[2] has the unit of measure
      }]
    }) 
		i += 4;
		data = values.slice(i,i+4);
	}

  multiplexer.add({
    "updates": updates,
    "context": multiplexer._context
  });
	
	

	return true;
});


