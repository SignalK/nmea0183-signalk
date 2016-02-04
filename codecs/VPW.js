/*
* VPW codec
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
VPW - Speed parallell to wind

        0   1 2   3 4
        |   | |   | |
 $--VPW,x.x,N,x.x,M*hh<CR><LF>
Field Number:

0 - Speed, "-" means downwind , knots
1 - N = Knots
2 - Speed, "-" means downwind , m/s
3 - M = Meters per second
4 - Checksum
*/

var Codec = require('../lib/NMEA0183');
module.exports = new Codec('VPW', function(multiplexer, input) {
  var values = input.values;
    
	multiplexer.self();

  multiplexer.add({
    "updates": [{
      "source": this.source(input.instrument),
      "timestamp": this.timestamp(),
      "values": [{
        "path": "performance.velocityMadeGood",
        	"value": this.float(values[2])
      }]
    }],
    "context": multiplexer._context
  });
	return true;
});
