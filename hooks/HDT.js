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
=== HDT - Heading True ===
------------------------------------------------------------------------------
*******0   1 2
*******|   | |
$--HDT,x.x,T*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Heading True
1. T = True
2. Checksum
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  if (
    (typeof parts[0] !== 'string' && typeof parts[0] !== 'number') ||
    (typeof parts[0] === 'string' && parts[0].trim() === '')
  ) {
    return null
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.headingTrue',
            value: utils.transform(utils.float(parts[0]), 'deg', 'rad'),
          },
        ],
      },
    ],
  }

  return delta
}
