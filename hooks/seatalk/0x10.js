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
10  01  XX  YY  Apparent Wind Angle: XXYY/2 degrees right of bow
                 Used for autopilots Vane Mode (WindTrim)
                 Corresponding NMEA sentence: MWV
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var XX = parseInt(parts[2], 16)
  var YY = parseInt(parts[3], 16)
  //  console.log("XX:"+XX)
  //  console.log("YY:"+YY)
  var apparentWindAngle = (256 * XX + YY) / 2.0
  if (apparentWindAngle > 180) {
    apparentWindAngle = apparentWindAngle - 360
  }
  //  console.log("apparentWindAngle:"+apparentWindAngle)
  var pathValues = []

  pathValues.push({
    path: 'environment.wind.angleApparent',
    value: utils.transform(utils.float(apparentWindAngle), 'deg', 'rad'),
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
