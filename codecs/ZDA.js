/*
 * ZDA codec
 *
 * Copyright 2014, Mikko Vesikkala
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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

"use strict"

/*
=== ZDA - Time & Date ===

------------------------------------------------------------------------------
*******1         2  3  4    5  6  7
*******|         |  |  |    |  |  |
$--ZDA,hhmmss.ss,xx,xx,xxxx,xx,xx*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:
1. UTC time (hours, minutes, seconds, may have fractional subsecond)
2. Day, 01 to 31
3. Month, 01 to 12
4. Year (4 digits)
5. Local zone description, 00 to +- 13 hours
6. Local zone minutes description, apply same sign as local hours
7. Checksum
*/

var Codec = require('../lib/NMEA0183')

module.exports = new Codec('ZDA', function(multiplexer, input) {
  var values = input.values
  multiplexer.self()
  const time = (values[0] || '').substring(0, 6)
  const date = '' + values[1] + values[2] + (values[3] || '').slice(-2)
  if (time.length === 6 && date.length === 6) {
    const ts = this.timestamp(time, date)
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": ts,
        "values": [{
          "path": "navigation.datetime",
          "value": ts
        }]
      }],
      "context": multiplexer._context
    })
  }

  return true
})