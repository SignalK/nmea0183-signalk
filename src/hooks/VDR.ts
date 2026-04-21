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
VDR - Set and Drift
        0   1 2   3 4   5 6
        |   | |   | |   | |
 $--VDR,x.x,T,x.x,M,x.x,N*hh<CR><LF>
Field Number:
0 - Degress True
1 - T = True
2 - Degrees Magnetic
3 - M = Magnetic
4 - Knots (speed of current)
5 - N = Knots
6 - Checksum
*/

// Per IEC 61162-1 §7.2.3.4, every optional numeric field is null-preserving
// so that a receiver reporting e.g. only magnetic set doesn't silently
// fabricate a true-set of 0°.

const VDR: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const setTrue = utils.transformOrNull(parts[0]!, 'deg', 'rad')
  const setMagnetic = utils.transformOrNull(parts[2]!, 'deg', 'rad')
  const drift = utils.transformOrNull(parts[4]!, 'knots', 'ms')

  if (setTrue === null && setMagnetic === null && drift === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.current',
            value: {
              setTrue,
              setMagnetic,
              drift
            }
          }
        ]
      }
    ]
  }
}

export default VDR
