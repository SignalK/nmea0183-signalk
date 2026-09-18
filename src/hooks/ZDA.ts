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

/**
 * ZDA is the one sentence that states the century outright, so its year is
 * read as sent. The sentence used to be handed to `utils.timestamp`, which
 * takes a 2-digit year and re-expands it with the IEC 61162-1 pivot (YY < 80
 * means 20YY); truncating a 4-digit year to feed that helper moved everything
 * before 1980 forward a century, stamping a 1979 sentence as 2079.
 *
 * A talker that sends only 2 digits still gets the pivot, since that is the
 * only reading available for it.
 */
function toYear(field: string): number | null {
  if (/^\d{4}$/.test(field)) {
    return utils.int(field)
  }
  if (/^\d{2}$/.test(field)) {
    const yy = utils.int(field)
    return yy < 80 ? 2000 + yy : 1900 + yy
  }
  return null
}

/** Time of day read the way `utils.timestamp` reads it, fraction included. */
function toIsoTimestamp(
  time: string,
  year: number,
  month: number,
  day: number
): string {
  const hours = utils.int(time.slice(0, 2))
  const minutes = utils.int(time.slice(2, 4))
  const seconds = utils.int(time.slice(4, 6))
  // '.7' -> 700, '.71' -> 710, '.7123' -> 712
  const fraction = /\.(\d+)/.exec(time)
  const milliseconds = fraction
    ? parseInt((fraction[1]! + '000').slice(0, 3), 10)
    : 0
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes, seconds, milliseconds)
  ).toISOString()
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
  const day = parts[1]! || ''
  const month = parts[2]! || ''
  const year = toYear(parts[3]! || '')

  if (
    time.length >= 6 &&
    /^\d{2}$/.test(day) &&
    /^\d{2}$/.test(month) &&
    year !== null &&
    empty < 3
  ) {
    return {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.datetime',
              value: toIsoTimestamp(
                time,
                year,
                utils.int(month),
                utils.int(day)
              )
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
