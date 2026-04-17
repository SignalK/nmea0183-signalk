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
const debug = Debug('signalk-parser-nmea0183/BOD')
/**
 * $GPBOD,045.,T,023.,M,DEST,START*01
 *
 * Bearing - origin to destination waypoint (BOD)
 *
 * 0) 045.       bearing 045 True from "START" to "DEST"
 * 1) T,           True
 * 2) 023.         bearing 023 Magnetic from "START" to "DEST"
 * 3) M            Magnetic
 * 4) DEST         destination waypoint ID
 * 5) START        origin waypoint ID
 **/

const BOD: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { id, sentence, parts, tags } = input
  const upper = (str: string) => str.trim().toUpperCase()

  debug(`[BODHook] decoding sentence ${id} => ${sentence}`)

  if (
    upper(parts[0]!) === '' ||
    upper(parts[1]!) === '' ||
    upper(parts[2]!) === '' ||
    upper(parts[3]!) === '' ||
    upper(parts[4]!) === ''
  ) {
    return null
  }

  const bearingOriginToDestination: Record<string, number> = {}

  bearingOriginToDestination[upper(parts[1]!) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[0]!, 'deg', 'rad')
  bearingOriginToDestination[upper(parts[3]!) === 'T' ? 'True' : 'Magnetic'] =
    utils.transform(parts[2]!, 'deg', 'rad')
  const destinationWaypointID = parts[4]!.trim()
  const originWaypointID = parts[5]!.trim()

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.courseRhumbline.bearingTrackTrue',
            value: bearingOriginToDestination['True'] ?? null
          },
          {
            path: 'navigation.courseRhumbline.bearingTrackMagnetic',
            value: bearingOriginToDestination['Magnetic'] ?? null
          },
          {
            path: 'navigation.courseRhumbline.nextPoint.ID',
            value: destinationWaypointID
          },
          {
            path: 'navigation.courseRhumbline.previousPoint.ID',
            value: originWaypointID
          }
        ]
      }
    ]
  }
}

export default BOD
module.exports = BOD
module.exports.default = BOD
