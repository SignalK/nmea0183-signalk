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

import * as utils from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
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

function convertToWindAngle(angle: number | string): number {
  const numAngle = utils.float(angle) % 360
  if (numAngle > 180 && numAngle <= 360) {
    return numAngle - 360
  }
  return numAngle
}

const VWT: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // get direction
  if (!parts[0]!) {
    return null
  }
  var angle = convertToWindAngle(parts[0]!)

  if (!parts[1]!) {
    return null
  }
  switch (parts[1]!) {
    case 'L':
      angle = -1 * utils.transform(angle, 'deg', 'rad')
      break
    case 'R':
      angle = utils.transform(angle, 'deg', 'rad')
      break
    default:
      return null
  }

  // get speed data: m/s is preferred, kph and knots fall back in order.
  // `speed` starts null so we can distinguish "not seen" from 0 m/s.
  let speed: number | null = null
  if (parts[2]! != '' && parts[3]! == 'N') {
    speed = utils.transform(utils.float(parts[2]!), 'knots', 'ms')
  }
  if (parts[6]! != '' && parts[7]! == 'K') {
    speed = utils.transform(utils.float(parts[6]!), 'kph', 'ms')
  }
  if (parts[4]! != '' && parts[5]! == 'M') {
    // m/s overrides knots or km/h when present (native unit, no conversion).
    speed = utils.float(parts[4]!)
  }
  if (speed === null) {
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
            value: speed
          },
          {
            path: 'environment.wind.angleTrueWater',
            value: angle
          }
        ]
      }
    ]
  }

  return delta
}

export default VWT
