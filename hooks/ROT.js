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

'use strict'

const utils = require('@signalk/nmea0183-utilities')

/*
# ROT - Rate Of Turn
#        0   1 2
#        |   | |
# $--ROT,x.x,A*hh<CR><LF>
# Field Number:
#
# 0 - Rate Of Turn, degrees per minute, "-" means bow turns to port
# 1 - Status, A means data is valid
# 2 - Checksum
#
#
*/

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  if (String(parts[1]).toUpperCase() !== 'A') {
    // Don't parse this sentence as it's void.
    return Promise.reject(new Error('Not parsing sentence as data is not valid)'))
  }

  try {
    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.rateOfTurn',
              value: utils.transform(utils.float(parts[0]), 'deg', 'rad') / 60
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
