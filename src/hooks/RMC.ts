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
import { coord } from '../lib/nmea-casts'
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

// Every optional numeric field goes through the `*OrNull` helpers so an
// empty NMEA field (IEC 61162-1 §7.2.3.4) maps to a Signal K `null`
// instead of a silent `0`. Reported in SignalK/nmea0183-signalk#192 —
// an empty magnetic-variation field was being emitted as 0°, causing a
// 13° course error for a reporter in a high-variation area.

const RMC: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const timestamp = utils.timestamp(parts[0]!, parts[8]!)
  // seconds since epoch; Date.parse avoids an extra Date allocation
  const age = Math.floor(Date.parse(timestamp) / 1000)

  const latitude = coord(parts[2]!, parts[3]!)
  const longitude = coord(parts[4]!, parts[5]!)

  // Negative SOG is not a legitimate measurement (speed is a magnitude);
  // treat as not-available rather than flipping sign.
  const sog = utils.floatOrNull(parts[6]!)
  const speed =
    sog === null || sog < 0 ? null : utils.transform(sog, 'knots', 'ms')

  const track = utils.transformOrNull(parts[7]!, 'deg', 'rad')

  const variationDeg = utils.magneticVariationOrNull(parts[9]!, parts[10]!)
  const variation =
    variationDeg === null ? null : utils.transform(variationDeg, 'deg', 'rad')

  const position =
    latitude !== null &&
    longitude !== null &&
    utils.isValidPosition(latitude, longitude)
      ? { latitude, longitude }
      : null

  return {
    updates: [
      {
        source: tags.source,
        timestamp: timestamp,
        values: [
          { path: 'navigation.position', value: position },
          { path: 'navigation.courseOverGroundTrue', value: track },
          { path: 'navigation.speedOverGround', value: speed },
          { path: 'navigation.magneticVariation', value: variation },
          { path: 'navigation.magneticVariationAgeOfService', value: age },
          { path: 'navigation.datetime', value: timestamp }
        ]
      }
    ]
  }
}

export default RMC
