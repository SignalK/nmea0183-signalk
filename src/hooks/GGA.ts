/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
=== GGA - Global Positioning System Fix Data ===
Time, Position and fix related data for a GPS receiver.
------------------------------------------------------------------------------
        0         1       2 3        4 5 6  7   8   9 10 11 12  13   14
        |         |       | |        | | |  |   |   | |   | |   |    |
 $--GGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Universal Time Coordinated (UTC)
1. Latitude
2. N or S (North or South)
3. Longitude
4. E or W (East or West)
5. GPS Quality Indicator,
     - 0 - fix not available,
     - 1 - GPS fix,
     - 2 - Differential GPS fix
           (values above 2 are 2.3 features)
     - 3 = PPS fix
     - 4 = Real Time Kinematic
     - 5 = Float RTK
     - 6 = estimated (dead reckoning)
     - 7 = Manual input mode
     - 8 = Simulation mode
6. Number of satellites in view, 00 - 12
7. Horizontal Dilution of precision (meters)
8. Antenna Altitude above/below mean-sea-level (geoid) (in meters)
9. Units of antenna altitude, meters
10. Geoidal separation, the difference between the WGS-84 earth
     ellipsoid and mean-sea-level (geoid), '-' means mean-sea-level
     below ellipsoid
11. Units of geoidal separation, meters
12. Age of differential GPS data, time in seconds since last SC104
     type 1 or 9 update, null field when DGPS is not used
13. Differential reference station ID, 0000-1023
14. Checksum
*/

// IEC 61162-1 §7.2.3.4: a null field (",,") signals "sensor working,
// value not available", so every *optional* field is emitted per-field
// with `null` when absent. Sentence-level short-circuiting only kicks
// in when there is literally no usable output at all (no position and
// no quality indicator) — otherwise a receiver reporting e.g. only
// position and no altitude would have been dropped entirely.

const GGA: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const time =
    parts[0] && parts[0].length > 0
      ? parts[0].indexOf('.') === -1
        ? parts[0]
        : parts[0].split('.')[0]!
      : ''
  const timestamp = time ? utils.timestamp(time) : tags.timestamp

  const quality = [
    'no GPS',
    'GNSS Fix',
    'DGNSS fix',
    'Precise GNSS',
    'RTK fixed integer',
    'RTK float',
    'Estimated (DR) mode',
    'Manual input',
    'Simulator mode',
    'Error'
  ]

  const latitude = coord(parts[1]!, parts[2]!)
  const longitude = coord(parts[3]!, parts[4]!)
  const position =
    latitude !== null &&
    longitude !== null &&
    utils.isValidPosition(latitude, longitude)
      ? { latitude, longitude }
      : null

  const qualityIdx = utils.intOrNull(parts[5]!)
  const methodQuality =
    qualityIdx !== null && qualityIdx >= 0 && qualityIdx < quality.length
      ? quality[qualityIdx]!
      : null

  // If neither position nor any quality signal is available the sentence
  // carries no useful data. Returning null matches the historical
  // "doesn't choke on empty sentence" test and keeps the output stream
  // free of all-null deltas.
  if (position === null && methodQuality === null) {
    return null
  }

  return {
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
            path: 'navigation.gnss.methodQuality',
            value: methodQuality
          },
          {
            path: 'navigation.gnss.satellites',
            value: utils.intOrNull(parts[6]!)
          },
          {
            path: 'navigation.gnss.antennaAltitude',
            value: utils.floatOrNull(parts[8]!)
          },
          {
            path: 'navigation.gnss.horizontalDilution',
            value: utils.floatOrNull(parts[7]!)
          },
          {
            path: 'navigation.gnss.geoidalSeparation',
            value: utils.floatOrNull(parts[10]!)
          },
          {
            path: 'navigation.gnss.differentialAge',
            value: utils.floatOrNull(parts[12]!)
          },
          {
            path: 'navigation.gnss.differentialReference',
            value: utils.intOrNull(parts[13]!)
          }
        ]
      }
    ]
  }
}

export default GGA
