'use strict'

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
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-parser-nmea0183/HDG')
const utils = require('@signalk/nmea0183-utilities')

/*
*******  0 1   2 3   4
*******  | |   | |   |
$--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>
Field Number:
0 Magnetic Sensor heading in degrees
1 Magnetic Deviation, degrees
2 Magnetic Deviation direction, E = Easterly, W = Westerly
3 Magnetic Variation degrees
4 Magnetic Variation direction, E = Easterly, W = Westerly
*/

function isEmpty(mixed) {
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input

    if (isEmpty(parts[0]) || isEmpty(parts[3]) || isEmpty(parts[4])) {
      return Promise.resolve(null)
    }

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.headingMagnetic',
              value: utils.transform(utils.float(parts[0]), 'deg', 'rad')
            },
            {
              path: 'navigation.magneticVariation',
              value: utils.transform(utils.float(parts[3]), 'deg', 'rad') * (parts[4] === 'E' ? 1 : -1)
            }
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
