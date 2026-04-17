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
20  01  XX  XX  Speed through water: XXXX/10 Knots
                                Corresponding NMEA sentence: VHW
*/

const S20: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  var speedThroughWater =
    (parseInt(parts[2]!, 16) + parseInt(parts[3]!, 16)) / 10.0
  var pathValues = []

  pathValues.push({
    path: 'navigation.speedThroughWater',
    value: utils.transform(utils.float(speedThroughWater), 'knots', 'ms')
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

export default S20
module.exports = S20
module.exports.default = S20
