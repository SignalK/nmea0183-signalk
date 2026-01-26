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

'use strict'

/*
82  05  XX  xx  YY  yy  ZZ  zz  Target waypoint name

4-character waypoint ID, transmitted after 0x85 on waypoint change.
Each pair of bytes represents one character.
XX/xx, YY/yy, ZZ/zz are character pairs (only first byte of each pair is significant).

References:
- http://www.thomasknauf.de/rap/seatalk2.htm
- https://opencpn.org/wiki/dokuwiki/doku.php?id=opencpn:supplementary_software:seatalk
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  if (parts.length < 6) {
    return null
  }

  // Parse the waypoint name characters
  // Format: 82 05 XX xx YY yy ZZ zz
  // Characters are at positions 2, 4, 6 (and sometimes 8)
  const chars = []

  // Character 1 (byte 2)
  if (parts[2] && parts[2] !== '00') {
    const char1 = parseInt(parts[2], 16)
    if (!isNaN(char1) && char1 > 0) {
      chars.push(String.fromCharCode(char1))
    }
  }

  // Character 2 (byte 4)
  if (parts.length > 4 && parts[4] && parts[4] !== '00') {
    const char2 = parseInt(parts[4], 16)
    if (!isNaN(char2) && char2 > 0) {
      chars.push(String.fromCharCode(char2))
    }
  }

  // Character 3 (byte 6)
  if (parts.length > 6 && parts[6] && parts[6] !== '00') {
    const char3 = parseInt(parts[6], 16)
    if (!isNaN(char3) && char3 > 0) {
      chars.push(String.fromCharCode(char3))
    }
  }

  // Character 4 (byte 8, if present)
  if (parts.length > 8 && parts[8] && parts[8] !== '00') {
    const char4 = parseInt(parts[8], 16)
    if (!isNaN(char4) && char4 > 0) {
      chars.push(String.fromCharCode(char4))
    }
  }

  const waypointName = chars.join('').trim()

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
            value: waypointName,
          },
        ],
      },
    ],
  }
}
