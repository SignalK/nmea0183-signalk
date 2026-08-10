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
 VLW - Distance Traveled through Water
 ------------------------------------------------------------------------------
        0   1 2   3 4
        |   | |   | |
 $--VLW,x.x,N,x.x,N*hh<CR><LF>
 ------------------------------------------------------------------------------
Field Number:
0. Total cumulative distance
1. N = Nautical Miles
2. Distance since Reset
3. N = Nautical Miles
4. Checksum

*/

const VLW: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // Per IEC 61162-1 §7.2.3.4, missing optional fields surface as `null`
  // so consumers can tell "receiver doesn't know" apart from "0 nm".
  const cumulative = utils.transformOrNull(parts[0]!, 'nm', 'm')
  const trip = utils.transformOrNull(parts[2]!, 'nm', 'm')

  if (cumulative === null && trip === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          { path: 'navigation.log', value: cumulative },
          { path: 'navigation.trip.log', value: trip }
        ]
      }
    ]
  }
}

export default VLW
