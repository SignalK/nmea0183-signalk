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
85  X6  XX  VU  ZW  ZZ  YF  00  yf  Navigation to waypoint information

Cross Track Error: XXX / 100 nautical miles
Bearing to destination: (U & 0x3) * 90 + WV / 2 degrees
                        U & 8 = 8 → True, U & 8 = 0 → Magnetic
Distance to destination: If Y & 1 = 1: ZZZ / 100 nm (0-9.99nm)
                         If Y & 1 = 0: ZZZ / 10 nm (≥10nm)
Direction to steer: Y & 4 = 4 → steer right, Y & 4 = 0 → steer left
Flags (F): Bit 0: XTE present
           Bit 1: Bearing present
           Bit 2: Range present
           Bit 3: XTE ≥ 0.3nm

References:
- http://www.thomasknauf.de/rap/seatalk2.htm
- https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:supplementary_software:seatalk
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  if (parts.length !== 9) {
    return null
  }

  // Parse hex values
  const X = parseInt(parts[1].charAt(0), 16)
  const XX = parseInt(parts[2], 16)
  const V = parseInt(parts[3].charAt(0), 16)
  const U = parseInt(parts[3].charAt(1), 16)
  const Z_high = parseInt(parts[4].charAt(0), 16)
  const W = parseInt(parts[4].charAt(1), 16)
  const ZZ = parseInt(parts[5], 16)
  const Y = parseInt(parts[6].charAt(0), 16)
  const F = parseInt(parts[6].charAt(1), 16)
  // parts[7] is always 00
  const yf = parseInt(parts[8], 16)

  const inputs = [X, XX, V, U, Z_high, W, ZZ, Y, F]
  if (!inputs.every((x) => !isNaN(x))) {
    return null
  }

  const pathValues = []

  // Cross Track Error: XXX / 100 nm
  // XXX is formed from X (high nibble of byte 1) and XX (byte 2)
  const xtePresent = (F & 0x1) === 0x1
  if (xtePresent) {
    const XXX = (X << 8) | XX
    const xteNm = XXX / 100
    // Direction to steer: Y & 4 = 4 → steer right (negative XTE), Y & 4 = 0 → steer left (positive XTE)
    const steerRight = (Y & 0x4) === 0x4
    const xteValue = steerRight ? -xteNm : xteNm
    pathValues.push({
      path: 'navigation.courseRhumbline.crossTrackError',
      value: utils.transform(xteValue, 'nm', 'm'),
    })
  }

  // Bearing to destination: (U & 0x3) * 90 + WV / 2 degrees
  // WV is formed from W (low nibble of byte 4) and V (high nibble of byte 3)
  const bearingPresent = (F & 0x2) === 0x2
  if (bearingPresent) {
    const WV = (W << 4) | V
    const bearingDeg = (U & 0x3) * 90 + WV / 2
    const bearingRad = utils.transform(bearingDeg, 'deg', 'rad')
    const isTrue = (U & 0x8) === 0x8

    if (isTrue) {
      pathValues.push({
        path: 'navigation.courseRhumbline.bearingToDestinationTrue',
        value: bearingRad,
      })
    } else {
      pathValues.push({
        path: 'navigation.courseRhumbline.bearingToDestinationMagnetic',
        value: bearingRad,
      })
    }
  }

  // Distance to destination
  // ZZZ is formed from Z_high (high nibble of byte 4) and ZZ (byte 5)
  const rangePresent = (F & 0x4) === 0x4
  if (rangePresent) {
    const ZZZ = (Z_high << 8) | ZZ
    // If Y & 1 = 1: ZZZ / 100 nm (0-9.99nm)
    // If Y & 1 = 0: ZZZ / 10 nm (≥10nm)
    const distanceNm = (Y & 0x1) === 0x1 ? ZZZ / 100 : ZZZ / 10
    pathValues.push({
      path: 'navigation.courseRhumbline.nextPoint.distance',
      value: utils.transform(distanceNm, 'nm', 'm'),
    })
  }

  if (pathValues.length === 0) {
    return null
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
