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
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
import Debug from 'debug'
const debug = Debug('signalk-parser-nmea0183/BWR')
/**
 * $GPBWR,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*38
 *
 * Bearing and distance to waypoint - rhumb line
 **/

const BWR: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { id, sentence, parts, tags } = input
  const upper = (str: string) => str.trim().toUpperCase()

  debug(`[BWRHook] decoding sentence ${id} => ${sentence}`)

  const havePosition =
    upper(parts[0]!) !== '' &&
    upper(parts[1]!) !== '' &&
    upper(parts[2]!) !== '' &&
    upper(parts[3]!) !== '' &&
    upper(parts[4]!) !== ''

  const timestamp = havePosition ? utils.timestamp(parts[0]!) : tags.timestamp
  const position = havePosition
    ? {
        latitude: coord(parts[1]!, parts[2]!),
        longitude: coord(parts[3]!, parts[4]!)
      }
    : null

  const distanceUnit = upper(parts[10]!) === 'N' ? 'nm' : 'km'
  const distance = havePosition
    ? utils.transformOrNull(parts[9]!, distanceUnit, 'm')
    : null

  const bearingToWaypoint: Record<string, number | null> = {
    True: null,
    Magnetic: null
  }
  if (havePosition) {
    const firstAxis = upper(parts[6]!) === 'T' ? 'True' : 'Magnetic'
    const secondAxis = upper(parts[8]!) === 'T' ? 'True' : 'Magnetic'
    bearingToWaypoint[firstAxis] = utils.transformOrNull(
      parts[5]!,
      'deg',
      'rad'
    )
    bearingToWaypoint[secondAxis] = utils.transformOrNull(
      parts[7]!,
      'deg',
      'rad'
    )
  }

  return {
    updates: [
      {
        timestamp,
        source: tags.source,
        values: [
          {
            path: 'navigation.courseRhumbline.bearingTrackTrue',
            value: bearingToWaypoint['True'] ?? null
          },
          {
            path: 'navigation.courseRhumbline.bearingTrackMagnetic',
            value: bearingToWaypoint['Magnetic'] ?? null
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.distance',
            value: distance
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.position',
            value: position
          }
        ]
      }
    ]
  }
}

export default BWR
