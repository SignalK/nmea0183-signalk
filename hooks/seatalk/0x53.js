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
53  U0  VW      Magnetic Course in degrees:
                  The two lower  bits of  U * 90 +
                  the six lower  bits of VW *  2 +
                  the two higher bits of  U /  2 =
                  (U & 0x3) * 90 + (VW & 0x3F) * 2 + (U & 0xC) / 8
                  The Magnetic Course may be offset by the Compass Variation (see datagram 99) to get the Course Over Ground (COG).
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var U = (parseInt(parts[1], 16) & 0xf0) >> 4
  var VW = parseInt(parts[2], 16)
  var magneticCourse = (U & 0x3) * 90.0 + (VW & 0x3f) * 2.0 + (U & 0xc) / 8.0

  var pathValues = []

  pathValues.push({
    path: 'navigation.courseOverGroundMagnetic',
    value: utils.transform(utils.float(magneticCourse), 'deg', 'rad'),
  })

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
