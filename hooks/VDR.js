/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
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

'use strict'

const utils = require('@signalk/nmea0183-utilities')

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

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  try {
    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [{
            "path": "environment.current",
            "value": {
              "setTrue": utils.transform(utils.float(parts[0]),'deg', 'rad'), 
              "setMagnetic": utils.transform(utils.float(parts[2]),'deg', 'rad'),
              "drift": utils.transform(utils.float(parts[4]), 'knots', 'ms')
            }
          }]
        }
      ],
    }

    return Promise.resolve({ delta })
  } catch (e) {
    return Promise.reject(e)
  }
}
