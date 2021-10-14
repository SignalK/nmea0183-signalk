'use strict'

/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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

const debug = require('debug')('signalk-parser-nmea0183/APB')
const utils = require('@signalk/nmea0183-utilities')

/*

       0 1    2 3 4 5 6   7 8    9  10  11 12
       | |    | | | | |   | |    |   |  |  |
$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C
where:
        APB       Autopilot format B
0       A         Loran-C blink/SNR warning, general warning
1       A         Loran-C cycle warning
2       0.10      cross-track error distance
3       R         steer Right to correct (or L for Left)
4       N         cross-track error units - nautical miles (K for kilometers)
5       V         arrival alarm - circle
6       V         arrival alarm - perpendicular
7,8     011,M     magnetic bearing, origin to destination
9       DEST      destination waypoint ID
10,11   011,M     magnetic bearing, present position to destination
12,13   011,M     magnetic heading to steer (bearings could True as 033,T)
*3C     Checksum

*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input
  const upper = (str) => str.trim().toUpperCase()

  debug(`[APBHook] decoding sentence ${id} => ${sentence}`)

  if (
    upper(parts[0]) === '' ||
    upper(parts[1]) === '' ||
    upper(parts[2]) === '' ||
    upper(parts[3]) === '' ||
    upper(parts[4]) === ''
  ) {
    return null
  }

  if (parts[0].trim().toUpperCase() === 'V') {
    // Don't parse this sentence as it's void.
    throw new Error(
      "Not parsing sentence for it's void (LORAN-C blink/SNR warning)"
    )
  }

  if (parts[1].trim().toUpperCase() === 'V') {
    throw new Error(
      "Not parsing sentence for it's void (LORAN-C cycle warning)"
    )
  }

  // XTE
  const direction = parts[3].trim().toUpperCase() === 'L' ? 1 : -1
  const xte =
    direction *
    utils.transform(
      parts[2],
      parts[4].trim().toUpperCase() === 'N' ? 'nm' : 'km',
      'm'
    )

  // WP arrival status
  const arrivalCircleEntered = parts[5].trim().toUpperCase() === 'A'
  const perpendicularPassed = parts[6].trim().toUpperCase() === 'A'

  // Bearing, origin to destination
  const bearingOriginToDest = utils.transform(parts[7], 'deg', 'rad')
  const bearingOriginToDestType =
    parts[8].trim().toUpperCase() === 'M' ? 'Magnetic' : 'True'

  // Destination Waypoint ID
  const destinationWaypointID = parts[9].trim()

  // Bearing, position to destination
  const bearingPositionToDest = utils.transform(parts[10], 'deg', 'rad')
  const bearingPositionToDestType =
    parts[11].trim().toUpperCase() === 'M' ? 'Magnetic' : 'True'

  // Heading to steer
  const headingToSteer = utils.transform(parts[12], 'deg', 'rad')
  const headingToSteerType =
    parts[13].trim().toUpperCase() === 'M' ? 'Magnetic' : 'True'

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.courseRhumbline.crossTrackError',
            value: xte,
          },
          {
            path: `navigation.courseRhumbline.bearingTrack${bearingOriginToDestType}`,
            value: bearingOriginToDest,
          },
          {
            path: `navigation.courseRhumbline.bearingOriginToDestination${bearingOriginToDestType}`,
            value: bearingOriginToDest,
          },
          {
            path: `navigation.courseRhumbline.bearingToDestination${bearingPositionToDestType}`,
            value: bearingPositionToDest,
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.ID',
            value: destinationWaypointID,
          },
          {
            path: `steering.autopilot.target.heading${headingToSteerType}`,
            value: headingToSteer,
          },
          {
            path: 'notifications.arrivalCircleEntered',
            value:
              arrivalCircleEntered === false
                ? null
                : {
                    method: ['sound', 'visual'],
                    state: 'alarm',
                    message: 'WP arrival circle entered!',
                  },
          },
          {
            path: 'notifications.perpendicularPassed',
            value:
              perpendicularPassed === false
                ? null
                : {
                    method: ['sound', 'visual'],
                    state: 'alarm',
                    message: 'Perpendicular passed!',
                  },
          },
        ],
      },
    ],
  }
}
