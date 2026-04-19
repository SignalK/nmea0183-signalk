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

import type { ParserTags } from '../types'

export interface TagBlockResult {
  sentence: string
  tags: ParserTags
}

/**
 * Parses an NMEA 0183 v4 tag block wrapping a sentence.
 *
 * Input example:
 *   `\\s:compass,c:1438489697*13\\$IIDBT,035.53,f,010.83,M,005.85,F*23`
 * Output:
 *   { sentence: '$IIDBT,...', tags: { source: 'compass', timestamp: '2015-08-02T...' } }
 *
 * Returns `false` when no tag block is present so callers can fall back to
 * default tags without a separate `null` vs `undefined` split.
 */
function getTagBlock(sentence: string): TagBlockResult | false {
  let split: string[] = []
  let block: string[] = []
  let source: string | undefined
  let timestamp: number | undefined

  // There could be a tag block...
  if (sentence.charAt(0) === '\\') {
    split = sentence.split('\\')
    split = split.filter((part) => {
      if (part.trim() === '') {
        return false
      }
      return true
    })
  }

  if (split.length < 2) {
    return false
  }

  const header = split[1]!
  if (header.trim().charAt(0) === '$' || header.trim().charAt(0) === '!') {
    sentence = header.trim()
    block = split[0]!.trim().split(',')
  }

  block.forEach((t) => {
    if (t.indexOf('c:') !== -1) {
      timestamp = parseInt(t.replace('c:', '').split('*')[0]!, 10)
    }

    if (t.indexOf('s:') !== -1) {
      source = t.replace('s:', '')
    }
  })

  const tags: ParserTags = {}
  if (source !== undefined) tags.source = source
  if (typeof timestamp === 'number') {
    const len = String(timestamp).length
    const withMs = len <= 12 ? timestamp * 1000 : timestamp
    // Date.prototype.toISOString always outputs canonical UTC, no tz lib needed
    tags.timestamp = new Date(withMs).toISOString()
  }

  return {
    sentence,
    tags
  }
}

export default getTagBlock
