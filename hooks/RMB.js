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

'use strict'

const utils = require('@signalk/nmea0183-utilities')
const moment = require('moment-timezone')

/*
RMC Sentence
$GPRMB,A,0.66,L,003,004,4917.24,N,12309.57,W,001.3,052.5,000.5,V*20
values:

-      RMB          Recommended minimum navigation information
[0]    A            Data status A = OK, V = Void (warning)
[1][2] 0.66,L       Cross-track error (nautical miles, 9.99 max),
                    steer Left to correct (or R = right)
[3]    003          Origin waypoint ID
[4]    004          Destination waypoint ID
[5][6] 4917.24,N    Destination waypoint latitude 49 deg. 17.24 min. N
[7][8] 12309.57,W   Destination waypoint longitude 123 deg. 09.57 min. W
[9]    001.3        Range to destination, nautical miles (999.9 max)
[10]   052.5        True bearing to destination
[11]   000.5        Velocity towards destination, knots
[12]   V            Arrival alarm  A = arrived, V = not arrived
-      *20          checksum

*/

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  let latitude = -1
  let longitude = -1
  let bearing = 0.0
  let vmg = 0.0
  let distance = 0.0
  let crossTrackError = 0.0

  latitude = utils.coordinate(parts[5], parts[6])
  longitude = utils.coordinate(parts[7], parts[8])
  if (isNaN(latitude) || isNaN(longitude)) {
    return Promise.resolve(null)
  }
  
  bearing = utils.float(parts[10])
  bearing = (!isNaN(bearing)) ? bearing : 0.0

  vmg = utils.float(parts[11])
  vmg = (!isNaN(vmg) && vmg > 0) ? vmg : 0.0

  distance = utils.float(parts[9])
  distance = (!isNaN(distance)) ? distance : 0.0
 
  crossTrackError = utils.float(parts[1])
  crossTrackError = (!isNaN(crossTrackError)) ? crossTrackError : 0.0

  crossTrackError = parts[2] == 'R' ? crossTrackError : -crossTrackError;

  try {
    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              'path': 'navigation.courseRhumbline.nextPoint',
              'value': {
                longitude,
                latitude
              }
            },

            {
              'path': 'navigation.courseRhumbline.nextPoint.bearingTrue',
              'value': utils.transform(bearing, 'deg', 'rad')
            },

            {
              'path': 'navigation.courseRhumbline.nextPoint.velocityMadeGood',
              'value': utils.transform(vmg, 'knots', 'ms')
            },

            {
              'path': 'navigation.courseRhumbline.nextPoint.distance',
              'value': utils.transform(distance, 'nm', 'km') * 1000
            },

            {
              'path': 'navigation.courseRhumbline.crossTrackError',
              value: utils.transform(crossTrackError, 'nm', 'km') * 1000
            }
          ]
        }
      ],
    }

    return Promise.resolve({ delta })
  } catch (e) {
    return Promise.reject(e)
  }
}
