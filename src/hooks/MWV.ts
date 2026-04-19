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
function convertToWindAngle(angle: number | string): number {
  const numAngle = utils.float(angle) % 360
  if (numAngle > 180 && numAngle <= 360) {
    return numAngle - 360
  }
  return numAngle
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
  let wsu: UnitFormat
  if (mwvCode === 'K') {
    wsu = 'kph'
  } else if (mwvCode === 'N') {
    wsu = 'knots'
  } else {
    wsu = 'ms'
  }

  const angle = convertToWindAngle(parts[0]!)
  const speed = utils.transform(parts[2]!, wsu, 'ms')
  const valueType = parts[1]!.toUpperCase() == 'R' ? 'Apparent' : 'True'
  const angleType = parts[1]!.toUpperCase() == 'R' ? 'Apparent' : 'TrueWater'

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.wind.speed' + valueType,
            value: speed
          },
          {
            path: 'environment.wind.angle' + angleType,
            value: utils.transform(angle, 'deg', 'rad')
          }
        ]
      }
    ]
  }

  return delta
}

export default MWV
