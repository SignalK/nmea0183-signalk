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
  * MTW - Mean Temperature of Water
  *
  *        0   1 2
  *        |   | |
  * $--MTW,x.x,C*hh<CR><LF>
  *
  * Field Number:
  *   0.    Degrees
  *   1.    Unit of Measurement, Celcius
  *   2.    Checksum
  *
  */

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  try {
    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'environment.water.temperature',
              value: utils.transform(utils.float(parts[0]), 'c', 'k')
              //returns raw value, no transformation done
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
