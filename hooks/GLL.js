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
 
const debug = require('debug')('signalk-parser-nmea0183/GLL')
const utils = require('@signalk/nmea0183-utilities')
const moment = require('moment-timezone')

/*
=== GLL - Geographic Position - Latitude/Longitude ===
------------------------------------------------------------------------------
        0       1 2        3 4         5 6   
        |       | |        | |         | |   
 $--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,a,m,*hh<CR><LF>
------------------------------------------------------------------------------
Field Number: 
0. Latitude
1. N or S (North or South)
2. Longitude
3. E or W (East or West)
4. Universal Time Coordinated (UTC)
5. Status A - Data Valid, V - Data Invalid
6. FAA mode indicator (NMEA 2.3 and later)
*/

function isEmpty(mixed) {
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input

    let valid = parts.reduce((v, part) => {
      v = !isEmpty(part)
      return v
    }, true)

    if (typeof parts[5] === 'string' && parts[5].toLowerCase() === 'v') {
      valid = false
    }

    if (!valid) {
      return Promise.resolve(null)
    }

    const time = parts[4].indexOf('.') === -1 ? parts[4] : parts[4].split('.')[0]
    const timestamp = utils.timestamp(time, moment.tz('UTC').format('DDMMYY'))

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: timestamp,
          values: [
            {
              path: 'navigation.position',
              value: {
                longitude: utils.coordinate(parts[2], parts[3]),
                latitude: utils.coordinate(parts[0], parts[1])
              }
            },
          ]
        }
      ],
    }
    
    return Promise.resolve({ delta })
  } catch (e) {
    debug(`Try/catch failed: ${e.message}`)
    return Promise.reject(e)
  }
}