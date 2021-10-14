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

const debug = require('debug')('signalk-parser-nmea0183/BWR')
const utils = require('@signalk/nmea0183-utilities')

/**
 * $GPBWR,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*38
 *
 * Bearing and distance to waypoint - rhumb line
 *
 * 0)     225444        UTC time of fix 22:54:44
 * 1,2)   4917.24,N     Latitude of waypoint
 * 3,4)   12309.57,W    Longitude of waypoint
 * 5,6)   051.9,T       Bearing to waypoint, degrees true
 * 7,8)   031.6,M       Bearing to waypoint, degrees magnetic
 * 9,10)  001.3,N       Distance to waypoint, Nautical miles
 * 11)    004           Waypoint ID
 **/

module.exports = function BWRHook(input) {
  const { id, sentence, parts, tags } = input
  const upper = (str) => str.trim().toUpperCase()

  debug(`[BWRHook] decoding sentence ${id} => ${sentence}`)

  if (
    upper(parts[0]) === '' ||
    upper(parts[1]) === '' ||
    upper(parts[2]) === '' ||
    upper(parts[3]) === '' ||
    upper(parts[4]) === ''
  ) {
    return null
  }

  const timestamp = utils.timestamp(parts[0])
  const latitude = utils.coordinate(parts[1], parts[2])
  const longitude = utils.coordinate(parts[3], parts[4])
  const distance = utils.transform(
    parts[9],
    upper(parts[10]) === 'N' ? 'nm' : 'km',
    'm'
  )

  const bearingToWaypoint = {}
  bearingToWaypoint[upper(parts[6]) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[5], 'deg', 'rad')
  bearingToWaypoint[upper(parts[8]) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[7], 'deg', 'rad')

  return {
    updates: [
      {
        timestamp,
        source: tags.source,
        values: [
          {
            path: 'navigation.courseRhumbline.bearingTrackTrue',
            value: bearingToWaypoint.True || null,
          },
          {
            path: 'navigation.courseRhumbline.bearingTrackMagnetic',
            value: bearingToWaypoint.Magnetic || null,
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.distance',
            value: distance,
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.position',
            value: {
              longitude,
              latitude,
            },
          },
        ],
      },
    ],
  }
}
