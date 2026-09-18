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
=== THS - True Heading and Status ===
------------------------------------------------------------------------------
*******0   1 2
*******|   | |
$--THS,x.x,a*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Heading True, degrees
1. Mode indicator:
     A = Autonomous
     E = Estimated (dead reckoning)
     M = Manual input
     S = Simulator
     V = Data not valid (including standby)
2. Checksum
*/

const THS: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // Only the mode indicator V marks the heading as unusable; A, E, M and S
  // all carry a heading the vessel may act on.
  if ((parts[1] ?? '').trim().toUpperCase() === 'V') {
    return null
  }

  const heading = utils.transformOrNull(parts[0]!, 'deg', 'rad')
  if (heading === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [{ path: 'navigation.headingTrue', value: heading }]
      }
    ]
  }
}

export default THS
