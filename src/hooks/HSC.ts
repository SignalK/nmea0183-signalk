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

  // Unit letters T / M identify which branch each numeric field
  // belongs to; either letter missing means the sentence is malformed.
  const firstUnit = upper(parts[1] ?? '')
  const secondUnit = upper(parts[3] ?? '')
  if (firstUnit === '' || secondUnit === '') {
    return null
  }

  const headingToSteer: Record<string, number | null> = {
    True: null,
    Magnetic: null
  }
  headingToSteer[firstUnit === 'T' ? 'True' : 'Magnetic'] =
    utils.transformOrNull(parts[0]!, 'deg', 'rad')
  headingToSteer[secondUnit === 'T' ? 'True' : 'Magnetic'] =
    utils.transformOrNull(parts[2]!, 'deg', 'rad')

  if (headingToSteer['True'] === null && headingToSteer['Magnetic'] === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'steering.autopilot.target.headingTrue',
            value: headingToSteer['True']
          },
          {
            path: 'steering.autopilot.target.headingMagnetic',
            value: headingToSteer['Magnetic']
          }
        ]
      }
    ]
  }
}

export default HSC
