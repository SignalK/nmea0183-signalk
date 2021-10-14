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
 VLW - Distance Traveled through Water
 ------------------------------------------------------------------------------
        0   1 2   3 4
        |   | |   | |
 $--VLW,x.x,N,x.x,N*hh<CR><LF>
 ------------------------------------------------------------------------------
Field Number:
0. Total cumulative distance
1. N = Nautical Miles
2. Distance since Reset
3. N = Nautical Miles
4. Checksum

*/

module.exports = function (input) {
  var velocityValue
  const { id, sentence, parts, tags } = input
  var pathValues = []

  if (parts[0] != '') {
    pathValues.push({
      path: 'navigation.log',
      value: utils.transform(utils.float(parts[0]), 'nm', 'm'),
    })
  }
  if (parts[2] != '') {
    pathValues.push({
      path: 'navigation.trip.log',
      value: utils.transform(utils.float(parts[2]), 'nm', 'm'),
    })
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues,
      },
    ],
  }
}
