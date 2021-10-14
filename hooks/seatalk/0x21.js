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
 21  02  XX  XX  0X  Trip Mileage: XXXXX/100 nautical miles
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var XXXX = parseInt(parts[2], 16) + 256 * parseInt(parts[3], 16)
  var X = parseInt(parts[4], 16) & 0x0f
  var trip = (XXXX + X * 65536) / 100.0
  var pathValues = []

  pathValues.push({
    path: 'navigation.trip',
    value: utils.transform(utils.float(trip), 'nm', 'km') * 1000,
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
