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
import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../types'
/*
=== DPT - Depth of water ===
------------------------------------------------------------------------------
*******0   1   2
*******|   |   |
$--DPT,x.x,x.x*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. Depth, meters
1. transducer offset, positive means distance from tansducer to water line negative means distance from transducer to keel
2. Checksum
*/

const DPT: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const depth = utils.floatOrNull(parts[0]!)
  const offset = utils.floatOrNull(parts[1]!)

  const values: DeltaValue[] = [
    { path: 'environment.depth.belowTransducer', value: depth }
  ]

  // NMEA defines the offset sign: positive = transducer-to-waterline
  // distance, negative = transducer-to-keel distance. A missing or
  // zero offset carries no additional information.
  if (offset !== null && offset > 0) {
    values.push({
      path: 'environment.depth.surfaceToTransducer',
      value: offset
    })
    if (depth !== null) {
      values.push({
        path: 'environment.depth.belowSurface',
        value: depth + offset
      })
    }
  } else if (offset !== null && offset < 0) {
    values.push({
      path: 'environment.depth.transducerToKeel',
      value: -offset
    })
    if (depth !== null) {
      values.push({
        path: 'environment.depth.belowKeel',
        value: depth + offset
      })
    }
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values
      }
    ]
  }
}

export default DPT
