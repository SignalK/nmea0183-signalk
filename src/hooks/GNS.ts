/**
 * Copyright 2022 Signal K.
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
=== GNS - Fix Data ===
Time, Position and fix related data for a GPS receiver.
------------------------------------------------------------------------------
        0         1       2 3        4 5    6  7   8   9   10  11  12
        |         |       | |        | |    |  |   |   |   |   |   |
 $--GNS,hhmmss.ss,ddmm.mm,a,dddmm.mm,a,c--c,xx,x.x,x.x,x.x,x.x,x.x*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. UTC of position, hh is hours, mm is minutes, ss.ss is seconds
1. Latitude, dd is minutes, mm.mm is minutes
2. N or S (North or South)
3. Longitude, dd is minutes, mm.mm is minutes
4. E or W (East or West)
5. Mode indicator (non-null)
6. Total number of satellites in use, 00-99
7. Horizontal Dilution of Precision (HDOP)
8. Antenna altitude, meters, re:mean-sea-level (geoid)
9. Goeidal separation meters
10. Age of differential data
11. Differential reference station ID, 0000-4095
12. Navigational status
13. Checksum
*/

const MODES: Record<string, string> = {
  A: 'Autonomous',
  D: 'Differential',
  E: 'Estimated',
  F: 'RTK Float',
  M: 'Manual',
  N: 'No Valid Fix',
  P: 'Precise',
  R: 'RTK Integer',
  S: 'Simulator'
}

const SYSTEMS = ['GPS', 'GLONASS', 'Galileo', 'BeiDou', 'QZSS'] as const

function indicator(chars: string[]): Record<string, string | undefined> {
  return chars.reduce<Record<string, string | undefined>>((acc, c, i) => {
    const system = SYSTEMS[i]
    if (system !== undefined) {
      acc[system] = MODES[c]
    }
    return acc
  }, {})
}

const STATUS: Record<string, string> = {
  S: 'Safe',
  C: 'Caution',
  U: 'Unsafe',
  V: 'Not Valid'
}

// IEC 61162-1 §7.2.3.4: every optional field surfaces as `null` when
// missing. Short-circuit only when neither position nor mode indicator
// can be parsed (same logic as GGA).

const GNS: HookFn = function (
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

  const latitude = coord(parts[1]!, parts[2]!)
  const longitude = coord(parts[3]!, parts[4]!)
  const position =
    latitude !== null &&
    longitude !== null &&
    utils.isValidPosition(latitude, longitude)
      ? { latitude, longitude }
      : null

  const modeField = parts[5] ?? ''
  const methodQuality =
    modeField.length > 0 ? indicator(modeField.split('')) : null

  if (position === null && methodQuality === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: timestamp,
        values: [
          { path: 'navigation.position', value: position },
          { path: 'navigation.gnss.methodQuality', value: methodQuality },
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
            value: utils.floatOrNull(parts[9]!)
          },
          {
            path: 'navigation.gnss.differentialAge',
            value: utils.floatOrNull(parts[10]!)
          },
          {
            path: 'navigation.gnss.differentialReference',
            value: utils.intOrNull(parts[11]!)
          },
          {
            path: 'navigation.gnss.status',
            value: parts[12] !== undefined ? (STATUS[parts[12]!] ?? null) : null
          }
        ]
      }
    ]
  }
}

export default GNS
