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
 === VTG - Track made good and Ground speed ===
 ------------------------------------------------------------------------------
        0   1 2   3  4  5 6   7 8  9
        |   | |   |  |  | |   | |  |
 $--VTG,x.x,T,x.x,M,x.x,N,x.x,K,m,*hh<CR><LF>
 ------------------------------------------------------------------------------
 Field Number:
 0. Track Degrees
 1. T = True
 2. Track Degrees
 3. M = Magnetic
 4. Speed Knots
 5. N = Knots
 6. Speed Kilometers Per Hour
 7. K = Kilometers Per Hour
 8. FAA mode indicator (NMEA 2.3 and later)
 9. Checksum
 */

function isEmpty(mixed) {
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input

    if (parts[2] === '' && parts[0] === '' && parts[6] === '' && parts[4] === '') {
      return Promise.resolve(null)
    }

    let speed = 0.0

    if (utils.float(parts[6]) > 0 && String(parts[7]).toUpperCase() === 'K') {
      speed = utils.transform(utils.float(parts[6]), 'kph', 'ms');
    }

    if (utils.float(parts[4]) > 0 && String(parts[5]).toUpperCase() === 'N') {
      speed = utils.transform(utils.float(parts[4]), 'knots', 'ms');
    }

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.courseOverGroundMagnetic',
              value: utils.transform(utils.float(parts[2]), 'deg', 'rad')
            },
            {
              path: 'navigation.courseOverGroundTrue',
              value: utils.transform(utils.float(parts[0]), 'deg', 'rad')
            },
            {
              path: 'navigation.speedOverGround',
              value: speed
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
