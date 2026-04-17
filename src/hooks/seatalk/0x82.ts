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

import type { Delta, HookFn, ParserInput, ParserSession } from '../../types'

/*
82  05  XX  xx  YY  yy  ZZ  zz  Target waypoint name

4-character waypoint ID, transmitted after 0x85 on waypoint change.
Each data byte is followed by its complement (xx = 0xFF - XX, etc.).
Takes the last 4 chars of name, assumes upper case only.

Decoding (per Thomas Knauf's SeaTalk Technical Reference):
  char1 = (XX & 0x3F) + 0x30
  char2 = ((YY & 0x0F) * 4 + (XX & 0xC0) / 64) + 0x30
  char3 = ((ZZ & 0x03) * 16 + (YY & 0xF0) / 16) + 0x30
  char4 = ((ZZ & 0xFC) / 4) + 0x30

References:
- http://www.thomasknauf.de/rap/seatalk2.htm
- https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:supplementary_software:seatalk
*/

const S82: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  if (parts.length < 8) {
    return null
  }

  // Parse the 3 data bytes (positions 2, 4, 6)
  const XX = parseInt(parts[2]!, 16)
  const YY = parseInt(parts[4]!, 16)
  const ZZ = parseInt(parts[6]!, 16)

  if (isNaN(XX) || isNaN(YY) || isNaN(ZZ)) {
    return null
  }

  // Decode characters per Thomas Knauf's formula
  const c1 = (XX & 0x3f) + 0x30
  const c2 = (YY & 0x0f) * 4 + (XX & 0xc0) / 64 + 0x30
  const c3 = (ZZ & 0x03) * 16 + (YY & 0xf0) / 16 + 0x30
  const c4 = (ZZ & 0xfc) / 4 + 0x30

  // '0' (0x30) represents empty character positions - strip leading/trailing zeros
  const waypointName = String.fromCharCode(c1, c2, c3, c4).replace(
    /^0+|0+$/g,
    ''
  )

  if (waypointName.length === 0) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: [
          {
            path: 'navigation.courseRhumbline.nextPoint.ID',
            value: waypointName
          }
        ]
      }
    ]
  }
}

export default S82
module.exports = S82
module.exports.default = S82
