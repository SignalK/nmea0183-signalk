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
import type { Delta, HookFn, ParserInput, ParserSession } from '../../types'

/*
11  01  XX  0Y  Apparent Wind Speed: (XX & 0x7F) + Y/10 Knots
                 Units flag: XX&0x80=0    => Display value in Knots
                             XX&0x80=0x80 => Display value in Meter/Second
                 Corresponding NMEA sentence: MWV
*/

const S11: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  var XX = parseInt(parts[2]!, 16)
  var Y = parseInt(parts[3]!, 16)
  var apparentWindSpeed = (XX & 0x7f) + Y / 10.0
  var pathValues = []

  pathValues.push({
    path: 'environment.wind.speedApparent',
    value: utils.transform(utils.float(apparentWindSpeed), 'knots', 'ms')
  })

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

export default S11
