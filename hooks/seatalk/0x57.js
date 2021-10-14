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
57  S0  DD
                Sat Info: S number of sats, DD horiz. dillution of position, if S=1 -> DD=0x94
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var S = (parseInt(parts[1], 16) & 0xf0) >> 4
  var DD = parseInt(parts[2], 16)
  if (S == 1) {
    DD = 0x94
  }

  var pathValues = []

  pathValues.push({
    path: 'navigation.gnss.satellites',
    value: utils.float(S),
  })

  pathValues.push({
    path: 'navigation.gnss.horizontalDilution',
    value: utils.float(DD),
  })

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues,
      },
    ],
  }
}
