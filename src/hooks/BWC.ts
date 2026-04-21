/**
 * Copyright 2019 Signal K and Fabian Tollenaar <fabian@decipher.industries>.
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
import { coord } from '../lib/nmea-casts'
import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../types'
import Debug from 'debug'
const debug = Debug('signalk-parser-nmea0183/BWC')
/**
 * $GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*29
 *
 * Bearing and distance to waypoint - great circle
 *
 * 0)     225444        UTC time of fix 22:54:44
 * 1,2)   4917.24,N     Latitude of waypoint
 * 3,4)   12309.57,W    Longitude of waypoint
 * 5,6)   051.9,T       Bearing to waypoint, degrees true
 * 7,8)   031.6,M       Bearing to waypoint, degrees magnetic
 * 9,10)  001.3,N       Distance to waypoint, Nautical miles
 * 11)    004           Waypoint ID
 **/

const BWC: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { id, sentence, parts, tags } = input
  const upper = (str: string) => str.trim().toUpperCase()

  debug(`[BWCHook] decoding sentence ${id} => ${sentence}`)

  const values: DeltaValue[] = []
  const result: Delta = {
    updates: [
      {
        source: tags.source,
        values
      }
    ]
  }

  if (parts[0]! !== '') {
    result.updates[0]!.timestamp = utils.timestamp(parts[0]!)
  }

  // All four of parts[1..4] (lat/NS, lon/EW) are required to emit a
  // position — `coord('', pole)` returns 0, which would round-trip to
  // `{ latitude: 0, longitude: 0 }` if we only null-checked `coord`'s
  // return.
  const havePosition =
    parts[1]! !== '' && parts[2]! !== '' && parts[3]! !== '' && parts[4]! !== ''
  values.push({
    path: 'navigation.courseGreatCircle.nextPoint.position',
    value: havePosition
      ? {
          latitude: coord(parts[1]!, parts[2]!),
          longitude: coord(parts[3]!, parts[4]!)
        }
      : null
  })

  const distanceUnit = upper(parts[10]!) === 'N' ? 'nm' : 'km'
  const distance = utils.transformOrNull(parts[9]!, distanceUnit, 'm')
  if (distance !== null) {
    values.push({
      path: 'navigation.courseGreatCircle.nextPoint.distance',
      value: distance
    })
  }

  if (parts[6]! === 'T') {
    const bearing = utils.transformOrNull(parts[5]!, 'deg', 'rad')
    if (bearing !== null) {
      values.push({
        path: 'navigation.courseGreatCircle.bearingTrackTrue',
        value: bearing
      })
    }
  }
  if (parts[8]! === 'M') {
    const bearing = utils.transformOrNull(parts[7]!, 'deg', 'rad')
    if (bearing !== null) {
      values.push({
        path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
        value: bearing
      })
    }
  }

  return result
}

export default BWC
