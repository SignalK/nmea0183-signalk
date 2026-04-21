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
 * distributed under the License is distributed on an 'AS IS' BASIS,
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

/*
RMB Sentence
$GPRMB,A,0.66,L,003,004,4917.24,N,12309.57,W,001.3,052.5,000.5,V*20

[0]    Data status A = OK, V = Void
[1][2] Cross-track error magnitude, steer direction L / R
[3]    Origin waypoint ID
[4]    Destination waypoint ID
[5][6] Destination waypoint latitude / pole
[7][8] Destination waypoint longitude / pole
[9]    Range to destination, nautical miles
[10]   True bearing to destination
[11]   Velocity towards destination, knots
[12]   Arrival alarm A = arrived, V = not arrived
*/

const RMB: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const position =
    parts[5]!.trim() !== '' && parts[7]!.trim() !== ''
      ? {
          longitude: coord(parts[7]!, parts[8]!),
          latitude: coord(parts[5]!, parts[6]!)
        }
      : null

  const bearing = utils.transformOrNull(parts[10]!, 'deg', 'rad')
  // VMG negative values indicate moving away from the destination. The
  // previous code clamped them to 0 — we keep that behaviour because
  // the Signal K path is "velocity made good" and a negative figure
  // would be unusual for downstream autopilot logic, but a truly
  // missing field now surfaces as null.
  const rawVmg = utils.floatOrNull(parts[11]!)
  const vmg =
    rawVmg === null
      ? null
      : utils.transform(rawVmg > 0 ? rawVmg : 0, 'knots', 'ms')
  const distanceNm = utils.floatOrNull(parts[9]!)
  const distance =
    distanceNm === null ? null : utils.transform(distanceNm, 'nm', 'm')

  const rawXte = utils.floatOrNull(parts[1]!)
  const directionLetter = parts[2]!
  const crossTrackError =
    rawXte === null
      ? null
      : utils.transform(directionLetter === 'L' ? rawXte : -rawXte, 'nm', 'm')

  const originWaypointID = (parts[3]! || '').trim()
  const destinationWaypointID = (parts[4]! || '').trim()

  const values: DeltaValue[] = [
    { path: 'navigation.courseRhumbline.nextPoint.position', value: position },
    {
      path: 'navigation.courseRhumbline.nextPoint.bearingTrue',
      value: bearing
    },
    {
      path: 'navigation.courseRhumbline.nextPoint.velocityMadeGood',
      value: vmg
    },
    {
      path: 'navigation.courseRhumbline.nextPoint.distance',
      value: distance
    },
    {
      path: 'navigation.courseRhumbline.crossTrackError',
      value: crossTrackError
    }
  ]

  if (destinationWaypointID) {
    values.push({
      path: 'navigation.courseRhumbline.nextPoint.ID',
      value: destinationWaypointID
    })
  }
  if (originWaypointID) {
    values.push({
      path: 'navigation.courseRhumbline.previousPoint.ID',
      value: originWaypointID
    })
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values
      }
    ]
  }
}

export default RMB
