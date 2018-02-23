'use strict'

/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
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
 
const debug = require('debug')('signalk-parser-nmea0183/GGA')
const utils = require('@signalk/nmea0183-utilities')
const moment = require('moment-timezone')

/*
=== GGA - Global Positioning System Fix Data ===
Time, Position and fix related data for a GPS receiver.
------------------------------------------------------------------------------
        0         1       2 3        4 5 6  7   8   9 10 11 12  13   14
        |         |       | |        | | |  |   |   | |   | |   |    |
 $--GGA,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x,xx,x.x,x.x,M,x.x,M,x.x,xxxx*hh<CR><LF>
------------------------------------------------------------------------------
Field Number: 
0. Universal Time Coordinated (UTC)
1. Latitude
2. N or S (North or South)
3. Longitude
4. E or W (East or West)
5. GPS Quality Indicator,
     - 0 - fix not available,
     - 1 - GPS fix,
     - 2 - Differential GPS fix
           (values above 2 are 2.3 features)
     - 3 = PPS fix
     - 4 = Real Time Kinematic
     - 5 = Float RTK
     - 6 = estimated (dead reckoning)
     - 7 = Manual input mode
     - 8 = Simulation mode
6. Number of satellites in view, 00 - 12
7. Horizontal Dilution of precision (meters)
8. Antenna Altitude above/below mean-sea-level (geoid) (in meters)
9. Units of antenna altitude, meters
10. Geoidal separation, the difference between the WGS-84 earth
     ellipsoid and mean-sea-level (geoid), '-' means mean-sea-level
     below ellipsoid
11. Units of geoidal separation, meters
12. Age of differential GPS data, time in seconds since last SC104
     type 1 or 9 update, null field when DGPS is not used
13. Differential reference station ID, 0000-1023
14. Checksum
*/

function isEmpty(mixed) {
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input
    
    const empty = parts.reduce((e, val) => {
      if (isEmpty(val)) {
        ++e
      }
      return e
    }, 0)

    if (empty > 3) {
      return Promise.resolve(null)
    }

    const time = parts[0].indexOf('.') === -1 ? parts[0] : parts[0].split('.')[0]
    const timestamp = utils.timestamp(time, moment.tz('UTC').format('DDMMYY'))

    const quality = [
      'no GPS',
      'GNSS Fix',
      'DGNSS fix',
      'Precise GNSS',
      'RTK fixed integer',
      'RTK float',
      'Estimated (DR) mode',
      'Manual input',
      'Simulator mode',
      'Error'
    ]

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: timestamp,
          values: [
            {
              path: 'navigation.position',
              value: {
                longitude: utils.coordinate(parts[3], parts[4]),
                latitude: utils.coordinate(parts[1], parts[2])
              }
            },
            {
              path: 'navigation.gnss.methodQuality',
              value: quality[utils.int(parts[5])]
            },

            {
              path: 'navigation.gnss.satellites',
              value: utils.int(parts[6])
            },

            {
              path: 'navigation.gnss.antennaAltitude',
              value: utils.int(parts[8])
            },

            {
              path: 'navigation.gnss.horizontalDilution',
              value: utils.int(parts[7])
            },

            {
              path: 'navigation.gnss.geoidalSeparation',
              value: utils.int(parts[11])
            },

            {
              path: 'navigation.gnss.differentialAge',
              value: utils.int(parts[12])
            },

            {
              path: 'navigation.gnss.differentialReference',
              value: Number(parts[13])
            }
          ]
        }
      ],
    }

    const toRemove = []

    delta.updates[0].values.forEach((update, index) => {
      if (typeof update.value === 'undefined' || update.value === null || (typeof update.value === 'string' && update.value.trim() === '') || (typeof update.value === 'number' && isNaN(update.value))) {
        toRemove.push(index)
      }
    })

    if (toRemove.length > 0) {
      toRemove.forEach(index => {
        delta.updates[0].values.splice(index, 1)
      })
    }
    
    return Promise.resolve({ delta })
  } catch (e) {
    debug(`Try/catch failed: ${e.message}`)
    return Promise.reject(e)
  }
}