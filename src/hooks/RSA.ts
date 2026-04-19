/**
 * Copyright 2019 Signal K <info@signalk.org> and contributors.
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

/**
Rudder Sensor Angle:
$--RSA,x.x,A,x.x,A*hh
Field Number:
1 Starboard (or single) rudder sensor, "-" means Turn To Port
2 Status, A means data is valid
3 Port rudder sensor
4 Status, A means data is valid
5 Checksum
 */

// Note: Only single rudder setup is currently supported

const RSA: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  if (String(parts[1]!).toUpperCase() !== 'A') {
    return null
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'steering.rudderAngle',
            value: utils.transform(utils.float(parts[0]!), 'deg', 'rad')
          }
        ]
      }
    ]
  }

  return delta
}

export default RSA
