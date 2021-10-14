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
9C  U1  VW  RR    Compass heading and Rudder position (see also command 84)
                    Compass heading in degrees:
                      The two lower  bits of  U * 90 +
                      the six lower  bits of VW *  2 +
                      number of bits set in the two higher bits of U =
                      (U & 0x3)* 90 + (VW & 0x3F)* 2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1): 0)
                    Turning direction:
                      Most significant bit of U = 1: Increasing heading, Ship turns right
                      Most significant bit of U = 0: Decreasing heading, Ship turns left
                    Rudder position: RR degrees (positive values steer right,
                      negative values steer left. Example: 0xFE = 2° left)
                    The rudder angle bar on the ST600R uses this record
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input
  var U = parseInt(parts[1].charAt(0), 16)
  var VW = parseInt(parts[2], 16)
  var RR = parseInt(parts[3], 16)

  if (Number.isNaN(U) || Number.isNaN(VW) || Number.isNaN(RR)) {
    return null
  }
  var compassHeading =
    (U & 0x3) * 90 +
    (VW & 0x3f) * 2 +
    (U & 0xc ? (U & (0xc == 0xc) ? 2 : 1) : 0)
  var rudderPos = RR
  if (rudderPos > 127) {
    rudderPos = rudderPos - 256
  }

  var pathValues = []
  if (compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: utils.transform(utils.float(compassHeading), 'deg', 'rad'),
    })
  }
  if (rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: utils.transform(utils.float(rudderPos), 'deg', 'rad'),
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
