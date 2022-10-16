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

const debug = require('debug')('signalk-parser-nmea0183/DBT')
const utils = require('@signalk/nmea0183-utilities')

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

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var depth = parts[0].trim() == '' ? null : utils.float(parts[0])

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'environment.depth.belowTransducer',
            value: depth,
          },
        ],
      },
    ],
  }

  var offset = utils.float(parts[1])

  if (offset > 0) {
    delta.updates[0].values.push({
      path: 'environment.depth.surfaceToTransducer',
      value: offset,
    })
    if (depth !== null) {
      delta.updates[0].values.push({
        path: 'environment.depth.belowSurface',
        value: depth + offset,
      })
    }
  } else if (offset < 0) {
    delta.updates[0].values.push({
      path: 'environment.depth.transducerToKeel',
      value: offset * -1,
    })
    if (depth !== null) {
      delta.updates[0].values.push({
        path: 'environment.depth.belowKeel',
        value: depth + offset,
      })
    }
  }

  return delta
}
