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

import * as utils from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
/*
 === VTG - Track made good and Ground speed ===
 ------------------------------------------------------------------------------
        0   1 2   3  4  5 6   7 8  9
        |   | |   |  |  | |   | |  |
 $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
 ------------------------------------------------------------------------------
 Field Number:
 0. Track Degrees
 1. T = True
 2. Track Degrees
 3. M = Magnetic
 4. Speed Knots
 5. N = Knots
 6. Speed Kilometers Per Hour
 7. K = Kilometers Per Hour
 8. FAA mode indicator (NMEA 2.3 and later)
 9. Checksum
 */

// Per IEC 61162-1 §7.2.3.4, every optional numeric field is routed
// through `*OrNull` so an empty NMEA field becomes `null` rather than a
// silent `0`. Previously `speedOverGround` defaulted to `0.0` when both
// speed fields were empty but at least one course was present — a fix
// the parser would report as stationary instead of unknown.

const VTG: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const courseTrue = utils.transformOrNull(parts[0]!, 'deg', 'rad')
  const courseMagnetic = utils.transformOrNull(parts[2]!, 'deg', 'rad')

  // Prefer kph when its unit letter is 'K' and the field parses. Fall
  // back to knots the same way. Legitimate zero (receiver is stationary)
  // returns `0`; null means the field was empty.
  const kph = utils.floatOrNull(parts[6]!)
  const knots = utils.floatOrNull(parts[4]!)
  let speedOverGround: number | null = null
  if (kph !== null && String(parts[7]!).toUpperCase() === 'K') {
    speedOverGround = utils.transform(kph, 'kph', 'ms')
  } else if (knots !== null && String(parts[5]!).toUpperCase() === 'N') {
    speedOverGround = utils.transform(knots, 'knots', 'ms')
  }

  if (
    courseTrue === null &&
    courseMagnetic === null &&
    speedOverGround === null
  ) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.courseOverGroundMagnetic',
            value: courseMagnetic
          },
          {
            path: 'navigation.courseOverGroundTrue',
            value: courseTrue
          },
          {
            path: 'navigation.speedOverGround',
            value: speedOverGround
          }
        ]
      }
    ]
  }
}

export default VTG
