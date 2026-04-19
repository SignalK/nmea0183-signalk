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
50  Z2  XX  YY  YY  LAT position: XX degrees, (YYYY & 0x7FFF)/100 minutes
                     MSB of Y = YYYY & 0x8000 = South if set, North if cleared
                     Z= 0xA or 0x0 (reported for Raystar 120 GPS), meaning unknown
                     Stable filtered position, for raw data use command 58
                     Corresponding NMEA sentences: RMC, GAA, GLL
*/

const S50: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // Z (upper nibble of parts[1]) carries the Raystar 120 tag byte; parsed
  // for completeness even though the value is not currently consumed.
  // void Z = (parseInt(parts[1]!, 16) & 0xf0) >> 4
  const XX = parseInt(parts[2]!, 16)
  const YYYY = parseInt(parts[3]!, 16) + 256 * parseInt(parts[4]!, 16)
  let s = 1
  if ((YYYY & 0x8000) != 0) {
    s = -1
  }
  const minutes = (YYYY & 0x7fff) / 100.0
  session['latitude'] = s * (XX + minutes / 60)

  const pathValues: Array<{ path: string; value: unknown }> = []

  if (
    session.hasOwnProperty('latitude') &&
    session.hasOwnProperty('longitude')
  ) {
    pathValues.push({
      path: 'navigation.position',
      value: {
        longitude: utils.float(session['longitude']),
        latitude: utils.float(session['latitude'])
      }
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

export default S50
