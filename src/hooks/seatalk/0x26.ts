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
import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../../types'

/*
26  04  XX  XX  YY  YY DE  Speed through water:
                        XXXX/100 Knots, sensor 1, current speed, valid if D&4=4
                        YYYY/100 Knots, average speed (trip/time) if D&8=0
                                or data from sensor 2 if D&8=8
                        E&1=1: Average speed calulation stopped
                        E&2=2: Display value in MPH
                        Corresponding NMEA sentence: VHW
*/

const S26: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // E = parseInt(parts[6]!, 16) & 0x0f — not used currently; preserved in the
  // spec comment above for reference.
  const D = (parseInt(parts[6]!, 16) & 0xf0) >> 4
  const XXXX = parseInt(parts[2]!, 16) + 256 * parseInt(parts[3]!, 16)
  const YYYY = parseInt(parts[4]!, 16) + 256 * parseInt(parts[5]!, 16)

  const value1 = XXXX / 100.0
  const value2 = YYYY / 100.0

  const pathValues: DeltaValue[] = []

  // Check if value1 is a valid speedThroughWater
  if ((D & 4) == 4) {
    var speedThroughWater = value1
    // Check if value2 is a valid speedThroughWater from sensor 2
    /*
    if ((D & 8)==8) {
      // compute the speedThroughWater as the average between the two values
      speedThroughWater=(value1+value2)/2
    }
    */
    pathValues.push({
      path: 'navigation.speedThroughWater',
      value: utils.transform(utils.float(speedThroughWater), 'knots', 'ms')
    })
  }

  // Check if value2 is a valid averageSpeedThroughWater
  if ((D & 8) == 0) {
    pathValues.push({
      path: 'navigation.averageSpeedThroughWater',
      value: utils.transform(utils.float(value2), 'knots', 'ms')
    })
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues
      }
    ]
  }
}

export default S26
