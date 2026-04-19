import * as utils from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
/*
 * ZDA codec
 *
 * Copyright 2014, Mikko Vesikkala
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
 *
 */

/*
=== ZDA - Time & Date ===

------------------------------------------------------------------------------
*******1         2  3  4    5  6  7
*******|         |  |  |    |  |  |
$--ZDA,hhmmss.ss,xx,xx,xxxx,xx,xx*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:
1. UTC time (hours, minutes, seconds, may have fractional subsecond)
2. Day, 01 to 31
3. Month, 01 to 12
4. Year (4 digits)
5. Local zone description, 00 to +- 13 hours
6. Local zone minutes description, apply same sign as local hours
7. Checksum
*/

function isEmpty(mixed: unknown): boolean {
  return typeof mixed !== 'string' || mixed.trim() === ''
}

const ZDA: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const empty = parts.reduce((e, val) => {
    if (isEmpty(val)) {
      ++e
    }
    return e
  }, 0)

  if (empty > 3) {
    return null
  }

  const time = parts[0]! || ''
  const date = parts[1]! + parts[2]! + (parts[3]! || '').slice(-2)

  if (time.length >= 6 && date.length === 6 && empty < 3) {
    return {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.datetime',
              value: utils.timestamp(time, date)
            }
          ]
        }
      ]
    }
  }

  // Preserve historical behaviour: return an empty object (as any) when the
  // fields do not form a complete datetime. The `{}` value is cast so strict
  // typing still holds for the Delta | null return.
  return {} as Delta
}

export default ZDA
