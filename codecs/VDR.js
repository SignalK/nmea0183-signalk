/*
* RPM codec
*
* @repository https://github.com/signalk/nmea-signalk
* @author Joachim Bakke, joabakk
*
*
* Copyright 2016, Joachim Bakke
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
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
VDR - Set and Drift
        0   1 2   3 4   5 6
        |   | |   | |   | |
 $--VDR,x.x,T,x.x,M,x.x,N*hh<CR><LF>
Field Number:

0 - Degress True
1 - T = True
2 - Degrees Magnetic
3 - M = Magnetic
4 - Knots (speed of current)
5 - N = Knots
6 - Checksum
*/

var Codec = require('../lib/NMEA0183');
module.exports = new Codec('VDR', function(multiplexer, input) {
  var values = input.values;
    
	multiplexer.self();

  multiplexer.add({
    "updates": [{
      "source": this.source(input.instrument),
      "timestamp": this.timestamp(),
      "values": [{
        "path": "environment.current",
        	"value": {
        		"setTrue": this.transform(values[0],'deg', 'rad'),
        		"setMagnetic": this.transform(values[2],'deg', 'rad'),
        		"drift": this.transform(values[4], 'knots', 'ms')
	        }
      }]
    }],
    "context": multiplexer._context
  });
	return true;
});
