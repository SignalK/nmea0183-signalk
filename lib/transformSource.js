'use strict'

/**
 * transformSource.js
 * 
 * Checks if the "source" key in each update is an object, 
 * creates the object if it's a string.
 *
 * @param "data": object with a key called "delta"
 */
module.exports = function transformSource(data, sentence, talker) {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (typeof data.delta !== 'object' || data.delta === null) {
    return data
  }

  if (!Array.isArray(data.delta.updates)) {
    return data
  }

  data.delta.updates = data.delta.updates.map(update => {
    if (typeof update.source === 'object' && update.source !== null) {
      return update
    }

    const _source = update.source
    const tagSentence = _source.split(':')[1]
    let tagTalker = _source.split(':')[0]

    if (talker === 'nmea0183') {
      talker = 'SK'
    }

    update.source = {
      sentence : tagSentence || sentence,
      talker: tagTalker || talker,
      type: 'NMEA0183'
    }

    return update
  })

  return data
}