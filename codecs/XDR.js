/*
 * XDRcodec
 *
 * @repository    https://github.com/signalk/nmea-signalk
 * @author      Teppo Kurki <teppo.kurki@iki.fi>
 *
 *
 *
 * Copyright 2016, Teppo Kurki
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
       1 2   3 4            n
       | |   | |            |
$--XDR,a,x.x,a,c--c, ..... *hh<CR><LF>
Field Number:
1: Transducer Type
2: Measurement Data
3: Units of measurement
4: Name of transducer

There may be any number of quadruplets like this, each describing a sensor. The last field will be a checksum as usual.
 */

var Codec = require('../lib/NMEA0183');
var Qty = require('js-quantities');

var CtoK = Qty.swiftConverter("tempC", "tempK");

var types = {
  'YX': YX
}

//$YXXDR,C,7,C*54 - also from the nasa, outside temperature
function YX(input) {
  return [{
    "path": "environment.outside.temperature",
    "value": CtoK(Codec.prototype.float(input.values[1]))
  }]
}

module.exports = new Codec('XDR', function(multiplexer, input) {
  var lowerDecoder = types[input.instrument];

  if (lowerDecoder) {
    multiplexer.self();
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": lowerDecoder(input)
      }],
      "context": multiplexer._context
    });
    return true;
  }
});
