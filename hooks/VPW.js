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
VPW - Speed parallell to wind
        0   1 2   3 4
        |   | |   | |
 $--VPW,x.x,N,x.x,M*hh<CR><LF>
Field Number:
0 - Speed, "-" means downwind , knots
1 - N = Knots
2 - Speed, "-" means downwind , m/s
3 - M = Meters per second
4 - Checksum
*/

module.exports = function (parser, input) {
  var velocityValue
  const { id, sentence, parts, tags } = input
  if (parts[2]){
    velocityValue = utils.float(parts[2])
  }
  else if (parts[0]){
    velocityValue = utils.transform(utils.float(parts[0]), 'knots', 'ms')
  }
  else {
    return null
  }
  try {

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'performance.velocityMadeGood',
              value: velocityValue
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
