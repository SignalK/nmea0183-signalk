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
const debug = Debug('signalk-parser-nmea0183/XTE')
/**
 *        0 1 2   3 4
 *        | | |   | |
 * $--XTE,A,A,x.x,a,N,*hh
 *
 * 0) Status   V = LORAN-C blink or SNR warning
 *             A = general warning flag or other navigation systems when a reliable fix is not available
 *
 * 1) Status   V = Loran-C cycle lock warning flag
 *             A = OK or not used
 *
 * 2) Cross track error magnitude
 * 3) Direction to steer, L or R
 * 4) Cross track units. N = Nautical Miles
 **/

const XTE: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { id, sentence, parts, tags } = input

  debug(`[XTEHook] decoding sentence ${id} => ${sentence}`)

  if (parts[0]!.trim().toUpperCase() === 'V') {
    throw new Error(
      "Not parsing sentence for it's void (LORAN-C blink/SNR warning)"
    )
  }

  if (parts[1]!.trim().toUpperCase() === 'V') {
    throw new Error(
      "Not parsing sentence for it's void (LORAN-C cycle warning)"
    )
  }

  // Magnitude + direction together form a signed scalar. Either one
  // missing makes the XTE meaningless — previously the hook would
  // silently emit 0 (from utils.transform on an empty string) or an
  // unsigned positive/negative guess; `null` is the IEC-correct answer.
  const directionLetter = parts[3]!.trim().toUpperCase()
  const magnitudeMeters = utils.transformOrNull(
    parts[2]!,
    parts[4]!.trim().toUpperCase() === 'N' ? 'nm' : 'km',
    'm'
  )
  const sign = directionLetter === 'L' ? 1 : directionLetter === 'R' ? -1 : null
  const value =
    magnitudeMeters === null || sign === null ? null : sign * magnitudeMeters

  if (value === null) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.courseRhumbline.crossTrackError',
            value
          }
        ]
      }
    ]
  }
}

export default XTE
