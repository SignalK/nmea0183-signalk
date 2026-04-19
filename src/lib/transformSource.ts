/**
 * transformSource.ts
 *
 * Checks if the "source" key in each update is an object; creates the object
 * when it's a string (or absent). Returns the passed-in `data` unchanged if
 * it's not a delta object.
 */

import type { Delta } from '../types'

function transformSource<T>(data: T, sentence: string, talker: string): T {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const delta = data as unknown as Delta
  if (!Array.isArray(delta.updates)) {
    return data
  }

  delta.updates = delta.updates.map((update) => {
    if (typeof update.source === 'object' && update.source !== null) {
      return update
    }

    const _source = (update.source as string | undefined) || ''
    const parts = _source.split(':')
    const tagTalker = parts[0]
    const tagSentence = parts[1]

    let effectiveTalker = talker
    if (effectiveTalker === 'nmea0183') {
      effectiveTalker = 'SK'
    }

    update.source = {
      sentence: tagSentence || sentence,
      talker: tagTalker || effectiveTalker,
      type: 'NMEA0183'
    }

    return update
  })

  return data
}

export default transformSource
