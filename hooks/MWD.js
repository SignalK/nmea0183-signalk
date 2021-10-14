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

const debug = require('debug')('signalk-parser-nmea0183/MWD')
const utils = require('@signalk/nmea0183-utilities')

/*
 * $WIMWD,<0>,<1>,<2>,<3>,<4>,<5>,<6>,<7>*hh
 *
 * NMEA 0183 standard Wind Direction and Speed, with respect to north.
 *
 * <0> Wind direction, 0.0 to 359.9 degrees True, to the nearest 0.1 degree
 * <1> T = True
 * <2> Wind direction, 0.0 to 359.9 degrees Magnetic, to the nearest 0.1 degree
 * <3> M = Magnetic
 * <4> Wind speed, knots, to the nearest 0.1 knot.
 * <5> N = Knots
 * <6> Wind speed, meters/second, to the nearest 0.1 m/s.
 * <7> M = Meters/second
 */

module.exports = function (input) {
  const { id, sentence, parts, tags } = input
  var pathValues = []

  // get direction data:
  // return both, true and magnetic direction, if present in the NMEA sentence
  var haveDirection = false
  if (parts[0] != '' && parts[1] == 'T') {
    haveDirection = true
    pathValues.push({
      path: 'environment.wind.directionTrue',
      value: utils.transform(utils.float(parts[0]), 'deg', 'rad'),
    })
  }
  if (parts[2] != '' && parts[3] == 'M') {
    haveDirection = true
    pathValues.push({
      path: 'environment.wind.directionMagnetic',
      value: utils.transform(utils.float(parts[2]), 'deg', 'rad'),
    })
  }
  if (!haveDirection) {
    return null
  }

  // get speed data:
  // speed given in kn is used in case no speed in m/s is present in the NMEA sentence
  var haveSpeed = false
  var speed
  if (parts[4] != '' && parts[5] == 'N') {
    haveSpeed = true
    speed = utils.transform(utils.float(parts[4]), 'knots', 'ms')
  }
  if (parts[6] != '' && parts[7] == 'M') {
    haveSpeed = true
    speed = utils.float(parts[6])
  }
  if (!haveSpeed) {
    return null
  }
  pathValues.push({
    path: 'environment.wind.speedTrue',
    value: speed,
  })

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues,
      },
    ],
  }

  return delta
}
