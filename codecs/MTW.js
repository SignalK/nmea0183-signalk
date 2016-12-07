/*
 * MTW codec
 *
 * Copyright 2016, Philip J Freeman
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
 * MTW - Mean Temperature of Water
 *
 *        0   1 2
 *        |   | |
 * $--MTW,x.x,C*hh<CR><LF>
 *
 * Field Number:
 *   0.    Degrees
 *   1.    Unit of Measurement, Celcius
 *   2.    Checksum
 *
 */

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('MTW', function(multiplexer, input) {
  var values = input.values;

	multiplexer.self();

  multiplexer.add({
    "updates": [{
      "source": this.source(input.instrument),
      "timestamp": this.timestamp(),
      "values": [{
        "path": "environment.water.temperature",
        "value": this.transform(this.float(values[0]),'c', 'k')
      }]
    }],
    "context": multiplexer._context
  });

	return true;
});
