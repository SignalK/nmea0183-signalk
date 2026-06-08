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
import type { UnitFormat } from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'

// MWV is only emitted when the status field (parts[4]) is 'A' (valid).
// Within a valid sentence, angle and speed are each routed through the
// `*OrNull` helpers so an empty optional field becomes `null` rather
// than a silent 0 (the old code would report e.g. 0° apparent wind
// angle when the angle field was empty).

function convertToWindAngle(angle: number): number {
  const numAngle = angle % 360
  return numAngle > 180 && numAngle <= 360 ? numAngle - 360 : numAngle
}

const MWV: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  if (!parts[4]! || parts[4]!.toUpperCase() !== 'A') {
    return null
  }

  const mwvCode = parts[3]!.toUpperCase()
  const wsu: UnitFormat =
    mwvCode === 'K' ? 'kph' : mwvCode === 'N' ? 'knots' : 'ms'

  const rawAngleDeg = utils.floatOrNull(parts[0]!)
  const angle =
    rawAngleDeg === null
      ? null
      : utils.transform(convertToWindAngle(rawAngleDeg), 'deg', 'rad')
  const speed = utils.transformOrNull(parts[2]!, wsu, 'ms')

  const valueType = parts[1]!.toUpperCase() === 'R' ? 'Apparent' : 'True'
  const angleType = parts[1]!.toUpperCase() === 'R' ? 'Apparent' : 'TrueWater'

  if (angle === null && speed === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          { path: 'environment.wind.speed' + valueType, value: speed },
          { path: 'environment.wind.angle' + angleType, value: angle }
        ]
      }
    ]
  }
}

export default MWV
