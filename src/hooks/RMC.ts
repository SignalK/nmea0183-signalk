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
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as utils from '@signalk/nmea0183-utilities'
import type { Pole } from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'

/*
RMC Sentence
http://www.gpsinformation.org/dale/nmea.htm#RMC
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
values:
 -      RMC          Recommended Minimum sentence C
[0]     123519       Fix taken at 12:35:19 UTC
[1]     A            Status A=active or V=Void.
[2][3]  4807.038,N   Latitude 48 deg 07.038' N
[4][5]  01131.000,E  Longitude 11 deg 31.000' E
[6]     022.4        Speed over the ground in knots
[7]     084.4        Track angle in degrees True
[8]     230394       Date - 23rd of March 1994
[9][10] 003.1,W      Magnetic Variation
 -      *6A          The checksum data, always begins with *
*/

const RMC: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  let latitude = null
  let longitude = null
  let speed = null
  let track = null
  let variation = null

  const timestamp = utils.timestamp(parts[0]!, parts[8]!)
  // seconds since epoch; Date.parse avoids an extra Date allocation
  const age = Math.floor(Date.parse(timestamp) / 1000)

  // NMEA numeric fields are transported as strings. We preserve the original
  // guard (non-empty, numeric, correct hemisphere char) but the numeric
  // comparisons need an explicit Number() under strict mode.
  latitude =
    parts[2]!.trim().length > 0 &&
    !isNaN(Number(parts[2]!)) &&
    'NS'.includes(parts[3]!)
      ? utils.coordinate(parts[2]!, parts[3]! as Pole)
      : null
  longitude =
    parts[4]!.trim().length > 0 &&
    !isNaN(Number(parts[4]!)) &&
    'EW'.includes(parts[5]!)
      ? utils.coordinate(parts[4]!, parts[5]! as Pole)
      : null

  speed =
    parts[6]!.trim().length > 0 &&
    !isNaN(Number(parts[6]!)) &&
    Number(parts[6]!) >= 0
      ? utils.transform(parts[6]!, 'knots', 'ms')
      : null

  track =
    parts[7]!.trim().length > 0 && !isNaN(Number(parts[7]!))
      ? utils.transform(parts[7]!, 'deg', 'rad')
      : null

  variation =
    parts[9]!.trim().length > 0 &&
    !isNaN(Number(parts[9]!)) &&
    'EW'.includes(parts[10]!)
      ? utils.transform(
          utils.magneticVariation(parts[9]!, parts[10]! as Pole),
          'deg',
          'rad'
        )
      : null

  let position = null

  if (utils.isValidPosition(latitude, longitude)) {
    position = {
      latitude: latitude,
      longitude: longitude
    }
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: timestamp,
        values: [
          {
            path: 'navigation.position',
            value: position
          },
          {
            path: 'navigation.courseOverGroundTrue',
            value: track
          },
          {
            path: 'navigation.speedOverGround',
            value: speed
          },
          {
            path: 'navigation.magneticVariation',
            value: variation
          },
          {
            path: 'navigation.magneticVariationAgeOfService',
            value: age
          },
          {
            path: 'navigation.datetime',
            value: timestamp
          }
        ]
      }
    ]
  }

  return delta
}

export default RMC
module.exports = RMC
module.exports.default = RMC
