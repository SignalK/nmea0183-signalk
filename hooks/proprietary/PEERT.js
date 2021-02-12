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
  * ERT - Cooling Water Temperature for engine
  *
  *        0  1  2 3 4
  *        |  |  | | |
  * $PEERT,C,0,x.0,A*hh<CR><LF>
  *
  * Field Number:
  *   0.    Unit in C or F
  *   1.    Engine ID
  *   2.    Temperature value
  *   3.    Status, A means is valid
  *   4.    Chechsum
  *
  */

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  const inValue = utils.float(parts[2])
  const checkValue = function(inputValue){
      return inputValue === -127 ? '-' : inputValue
    }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        meta: [
          {
            path: 'environment.inside.engineRoom.temperature',
            value: {
              description: 'Engine room temperature in [K]',
              units: 'K'
             }
          }
        ],
        values: [
          {
            path: 'environment.inside.engineRoom.temperature',
            value: utils.transform(checkValue(inValue), 'C', 'K', 'F')
          }
        ]
      }
    ],
  }

  return delta
}
