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
#        0 1 2   3   4 5
#        | | |   |   | |
# $--RPM,a,x,x.x,x.x,A*hh<CR><LF> Field Number:
#  0) Source, S = Shaft, E = Engine 1) Engine or shaft number 2) Speed,
#  Revolutions per minute 3) Propeller pitch, % of maximum, "-" means
#  astern 4) Status, A means data is valid 5) Checksum
*/

const RPM: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const rpm = utils.floatOrNull(parts[2]!)
  const revolutions = rpm === null ? null : rpm / 60

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: `propulsion.${
              parts[0]!.toUpperCase() === 'S' ? 'shaft' : 'engine'
            }_${parts[1]!}.revolutions`,
            value: revolutions
          }
        ]
      }
    ]
  }
}

export default RPM
