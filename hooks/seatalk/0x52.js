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
52  01  XX  XX  Speed over Ground: XXXX/10 Knots
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var XXXX = parseInt(parts[2], 16) + 256 * parseInt(parts[3], 16)
  var speedOverGround = XXXX / 10.0
  var pathValues = []

  pathValues.push({
    path: 'navigation.speedOverGround',
    value: utils.transform(utils.float(speedOverGround), 'knots', 'ms'),
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
