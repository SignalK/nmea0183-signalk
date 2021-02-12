/**
 * Copyright 2021 Signal K <info@signalk.org>
 * Added from Norbert Walter <norbert-walter@web.de>
 * This custom centence coming from engine diagnostics device.
 * Refer: https://open-boat-projects.org/en/diy-motordiagnose/
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
  * SWF - Sea Water Flow cooling system
  *
  *        0  1  2 3 4
  *        |  |  | | |
  * $PESWF,L,0,x.0,A*hh<CR><LF>
  *
  * Field Number:
  *   0.    Unit in liters
  *   1.    Engine ID
  *   2.    Flow value
  *   3.    Status, A means is valid
  *   4.    Chechsum
  *
  */

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        meta: [
          {
            path: 'propulsion.engine_' + parts[1] + '.seaWaterFlow',
            value: {
              description: 'Sea water flow in [l/min]',
              units: 'l/min'
             }
          }
        ],
        values: [
          {
            path: 'propulsion.engine_' + parts[1] + '.seaWaterFlow',
            value: utils.float(parts[2])
          }
        ]
      }
    ],
  }

  return delta
}
