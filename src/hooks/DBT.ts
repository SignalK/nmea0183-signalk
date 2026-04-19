/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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
const FEET_TO_METERS = 0.3048

/*
=== DBT - Depth below transducer ===
------------------------------------------------------------------------------
*******0   1 2   3 4   5 6
*******|   | |   | |   | |
$--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Depth, feet
1. f = feet
2. Depth, meters
3. M = meters
4. Depth, Fathoms
5. F = Fathoms
6. Checksum
*/

const DBT: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const rawMeters = parts[2]
  let meterValue: number | null
  if (hasNoValue(rawMeters)) {
    const feetValue = parts[0]
    if (hasNoValue(feetValue)) {
      meterValue = null
    } else {
      meterValue = utils.float(feetValue) * FEET_TO_METERS
    }
  } else {
    meterValue = utils.float(rawMeters)
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.depth.belowTransducer',
            value: meterValue
          }
        ]
      }
    ]
  }

  return delta
}

const hasNoValue = (value: unknown): boolean =>
  typeof value !== 'string' || value.trim() === ''

export default DBT
