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

const debug = require('debug')('signalk-parser-nmea0183/VWT')
const utils = require('@signalk/nmea0183-utilities')

/*
 * $WIVWT,<0>,<1>,<2>,<3>,<4>,<5>,<6>,<7>*hh
 *
 * NMEA 0183 True wind angle in relation to the vessel's heading, and true wind
 * speed referenced to the water. True wind is the vector sum of the Relative
 * (apparent) wind vector and the vessel's velocity vector relative to the water along
 * the heading line of the vessel. It represents the wind at the vessel if it were
 * stationary relative to the water and heading in the same direction.
 *
 * <0> Calculated wind angle relative to the vessel, 0 to 180°, left/right of
 *     vessel heading, to the nearest 0.1 degree
 * <1> L = left, or R = right
 * <2> Calculated wind speed, knots, to the nearest 0.1 knot
 * <3> N = knots
 * <4> Wind speed, meters per second, to the nearest 0.1 m/s
 * <5> M = meters per second
 * <6> Wind speed, km/h, to the nearest km/h
 * <7> K = km/h
 */

// $IIVWT,030.,R,10.1,N,05.2,M,018.7,K*75

function convertToWindAngle(angle) {
  const numAngle = utils.float(angle) % 360
  if (numAngle > 180 && numAngle <= 360) {
    return numAngle - 360
  }
  return numAngle
}

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  // get direction
  if (!parts[0]) {
    return null
  }
  var angle = convertToWindAngle(parts[0])

  if (!parts[1]) {
    return null
  }
  switch (parts[1]) {
    case 'L':
      angle = -1 * utils.transform(angle, 'deg', 'rad')
      break
    case 'R':
      angle = utils.transform(angle, 'deg', 'rad')
      break
    default:
      return null
  }

  // get speed data:
  // speed value given in m/s is given precedence if present in the NMEA sentence
  var haveSpeed = false
  var speed
  if (parts[2] != '' && parts[3] == 'N') {
    haveSpeed = true
    speed = utils.transform(utils.float(parts[2]), 'knots', 'ms')
  }
  if (parts[6] != '' && parts[7] == 'K') {
    haveSpeed = true
    speed = utils.transform(utils.float(parts[6]), 'kph', 'ms')
  }
  if (parts[4] != '' && parts[5] == 'M') {
    // overwrite speed from knots or km/h if present
    haveSpeed = true
    speed = utils.float(parts[4])
  }
  if (!haveSpeed) {
    return null
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.wind.speedTrue',
            value: speed,
          },
          {
            path: 'environment.wind.angleTrueWater',
            value: angle,
          },
        ],
      },
    ],
  }

  return delta
}
