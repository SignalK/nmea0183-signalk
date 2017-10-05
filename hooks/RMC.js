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
http://www.gpsinformation.org/dale/nmea.htm#RMC
$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
values:
 -      RMC          Recommended Minimum sentence C
[0]     123519       Fix taken at 12:35:19 UTC
[1]     A            Status A=active or V=Void.
[2][3]  4807.038,N   Latitude 48 deg 07.038' N
[4][5]  01131.000,E  Longitude 11 deg 31.000' E
[6]     022.4        Speed over the ground in knots
[7]     084.4        Track angle in degrees True
[8]     230394       Date - 23rd of March 1994
[9][10] 003.1,W      Magnetic Variation
 -      *6A          The checksum data, always begins with *
*/

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  let latitude = -1
  let longitude = -1
  let speed = 0.0
  let track = 0.0
  let variation = 0.0

  try {
    const timestamp = utils.timestamp(parts[0], parts[8])
    const age = moment.tz(timestamp, 'UTC').unix()

    latitude = utils.coordinate(parts[2], parts[3])
    longitude = utils.coordinate(parts[4], parts[5])

    speed = utils.float(parts[6])
    speed = (!isNaN(speed) && speed > 0) ? speed : 0.0

    track = utils.float(parts[7])
    track = (!isNaN(track)) ? track : 0.0

    variation = utils.magneticVariaton(parts[9], parts[10])

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: timestamp,
          values: [
            {
              path: 'navigation.position',
              value: {
                longitude,
                latitude
              }
            },

            {
              path: 'navigation.courseOverGroundTrue',
              value: utils.transform(track, 'deg', 'rad')
            },

            {
              path: 'navigation.speedOverGround',
              value: utils.transform(speed, 'knots', 'ms')
            },

            {
              path: 'navigation.magneticVariation',
              value: utils.transform(variation, 'deg', 'rad')
            },

            {
              path: 'navigation.magneticVariationAgeOfService',
              value: age
            },

            {
              path: 'navigation.datetime',
              value: timestamp,
            },
          ]
        }
      ],
    }

    return Promise.resolve({ delta })
  } catch (e) {
    return Promise.reject(e)
  }
}
