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

import * as utils from '@signalk/nmea0183-utilities'
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'

/*
=== VHW - Water speed and heading ===
------------------------------------------------------------------------------
        0   1 2   3 4   5 6   7 8
        |   | |   | |   | |   | |
 $--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh<CR><LF>
------------------------------------------------------------------------------
$IIVHW,,T,,M,06.14,N,11.37,K*52
Field Number:
0: Degress True
1: T = True
2: Degrees Magnetic
3: M = Magnetic
4: Knots (speed of vessel relative to the water)
5: N = Knots
6. Kilometers (speed of vessel relative to the water)
7. K = Kilometers
8. Checksum
*/

const VHW: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input
  const pathValues: Array<{ path: string; value: unknown }> = []

  if (parts[0]! != '') {
    pathValues.push({
      path: 'navigation.headingTrue',
      value: utils.transform(utils.float(parts[0]!), 'deg', 'rad')
    })
  }
  if (parts[2]! != '') {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: utils.transform(utils.float(parts[2]!), 'deg', 'rad')
    })
  }
  if (parts[4]! != '') {
    pathValues.push({
      path: 'navigation.speedThroughWater',
      value: utils.transform(utils.float(parts[4]!), 'knots', 'ms')
    })
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues
      }
    ]
  }

  return delta
}

export default VHW
