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
VWR - Relative (Apparent) Wind Speed and Angle
        0  1  2  3  4  5  6  7 8
$--VWR,x.x,a,x.x,N,x.x,M,x.x,K*hh<CR><LF>
 0 - Measured wind angle relative to the vessel, 0 to 180 deg
 1 - a = L/R left or right of vessel heading
 2 - Measured wind Speed, knots
 3 - N = knots
 4 - Wind speed, meters/second
 5 - M = m/s
 6 - Wind speed, Km/Hr
 7 - K = km/h
 8 - Checksum
 */

 function isEmpty(mixed) {
   return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
 }

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  const empty = parts.reduce((count, part) => { count += (isEmpty(part) ? 1 : 0); return count; }, 0)
  if (empty > 3) {
    return Promise.resolve(null)
  }

  var rightPositive = 0;
  if (String(parts[1]).toUpperCase() === 'R') {
    rightPositive = 1;
  }else if (String(parts[1]).toUpperCase() === 'L') {
    rightPositive = -1;
  }

  try {
    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'environment.wind.angleApparent',
              value: utils.transform(utils.float(parts[0])*rightPositive, 'deg', 'rad')
            },
            {
              path: 'environment.wind.speedApparent',
              value: utils.transform(utils.float(parts[2]), 'knots', 'ms')
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
