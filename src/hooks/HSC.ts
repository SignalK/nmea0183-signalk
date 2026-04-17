/**
 * Copyright 2019 Signal K and Fabian Tollenaar <fabian@decipher.industries>.
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
import Debug from 'debug'
const debug = Debug('signalk-parser-nmea0183/HSC')
/**
 * $FTHSC,40.12,T,39.11,M*5E
 *
 * Heading Steering Command
 *
 * 0) 40.12         Heading to steer, degrees true
 * 1) T             True
 * 2) 39.11         Heading to steer, degrees magnetic
 * 3) M             Magnetic
 **/

const HSC: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { id, sentence, parts, tags } = input
  const upper = (str: string) => str.trim().toUpperCase()

  debug(`[HSCHook] decoding sentence ${id} => ${sentence}`)

  if (
    upper(parts[1]!) === '' ||
    upper(parts[3]!) === '' ||
    upper(parts[0]!) === '' ||
    upper(parts[2]!) === ''
  ) {
    return null
  }

  const headingToSteer: Record<string, number> = {}
  headingToSteer[upper(parts[1]!) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[0]!, 'deg', 'rad')
  headingToSteer[upper(parts[3]!) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[2]!, 'deg', 'rad')

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'steering.autopilot.target.headingTrue',
            value: headingToSteer['True'] ?? null
          },
          {
            path: 'steering.autopilot.target.headingMagnetic',
            value: headingToSteer['Magnetic'] ?? null
          }
        ]
      }
    ]
  }
}

export default HSC
module.exports = HSC
module.exports.default = HSC
