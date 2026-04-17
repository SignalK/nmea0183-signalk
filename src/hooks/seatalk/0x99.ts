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
import type { Delta, HookFn, ParserInput, ParserSession } from '../../types'

/*
99  00  XX        Compass variation sent by ST40 compass instrument
                     or ST1000, ST2000, ST4000+, E-80 every 10 seconds
                     but only if the variation is set on the instrument
                     Positive XX values: Variation West, Negative XX values: Variation East
                     Examples (XX => variation): 00 => 0, 01 => -1 west, 02 => -2 west ...
                                                 FF => +1 east, FE => +2 east ...
                   Corresponding NMEA sentences: RMC, HDG
   Reference: http://www.thomasknauf.de/rap/seatalk2.htm
*/

const S99: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  // XX is an 8-bit two's complement value. Per the SeaTalk spec, a positive
  // XX encodes West variation and a negative XX encodes East variation.
  // Signal K uses the navigation convention (East positive, West negative),
  // so the decoded byte must be negated.
  const XX = parseInt(parts[2]!, 16)
  const signed = XX > 127 ? XX - 256 : XX
  const magneticVariation = -signed

  const pathValues = [
    {
      path: 'navigation.magneticVariation',
      value: utils.transform(utils.float(magneticVariation), 'deg', 'rad')
    }
  ]

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues
      }
    ]
  }
}

export default S99
module.exports = S99
module.exports.default = S99
