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
 
const debug = require('debug')('signalk-parser-nmea0183/DBT')
const utils = require('@signalk/nmea0183-utilities')

/*
=== DBT - Depth below transducer ===
------------------------------------------------------------------------------
*******0   1 2   3 4   5 6
*******|   | |   | |   | |
$--DBT,x.x,f,x.x,M,x.x,F*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Depth, feet
1. f = feet
2. Depth, meters
3. M = meters
4. Depth, Fathoms
5. F = Fathoms
6. Checksum
*/

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts, tags } = input

    if ((typeof parts[2] !== 'string' && typeof parts[2] !== 'number') || (typeof parts[2] === 'string' && parts[2].trim() === '')) {
      return Promise.resolve(null)
    }

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'environment.depth.belowTransducer',
              value: utils.float(parts[2])
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