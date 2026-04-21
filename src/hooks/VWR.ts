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
VWR - Relative (Apparent) Wind Speed and Angle
        0  1  2  3  4  5  6  7 8
$--VWR,x.x,a,x.x,N,x.x,M,x.x,K*hh<CR><LF>
 0 - Measured wind angle relative to the vessel, 0 to 180 deg
 1 - a = L/R left or right of vessel heading
 2 - Measured wind Speed, knots
 3 - N = knots
 4 - Wind speed, meters/second
 5 - M = m/s
 6 - Wind speed, Km/Hr
 7 - K = km/h
 8 - Checksum
 */

// IEC 61162-1 §7.2.3.4: a null field means "sensor working, no data".
// A sensor reporting only speed (no direction) or only angle (no
// magnitude) used to be dropped by the pre-existing `empty > 4`
// count-gate even though the present fields are usable. The hook now
// emits per-field `null` for the missing half and only short-circuits
// when both halves are missing.

const VWR: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // Angle needs both the magnitude and the L/R direction letter; either
  // missing is a null measurement. `transformOrNull` preserves null
  // through the deg→rad conversion, so we only sign-flip when both
  // halves are present.
  const magnitudeRad = utils.transformOrNull(parts[0]!, 'deg', 'rad')
  const directionLetter = String(parts[1] ?? '').toUpperCase()
  const sign = directionLetter === 'R' ? 1 : directionLetter === 'L' ? -1 : null
  const angleApparent =
    magnitudeRad === null || sign === null ? null : magnitudeRad * sign

  const speedApparent = utils.transformOrNull(parts[2]!, 'knots', 'ms')

  if (angleApparent === null && speedApparent === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.wind.angleApparent',
            value: angleApparent
          },
          {
            path: 'environment.wind.speedApparent',
            value: speedApparent
          }
        ]
      }
    ]
  }
}

export default VWR
