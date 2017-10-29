'use strict'

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

const utils = require('@signalk/nmea0183-utilities')
const debug = require('debug')('signalk-parser-nmea0183/parse')
const getTagBlock = require('./getTagBlock')
const findHook = require('./findHook')
const transformSource = require('./transformSource')

module.exports = function parseSentence(emitter, sentence) {
  let tags = getTagBlock(sentence)

  if (tags !== false) {
    sentence = tags.sentence
    tags = tags.tags
  } else {
    tags = {}
  }

  if (typeof tags.timestamp === 'undefined') {
    tags.timestamp = new Date().toISOString()
  }

  let valid = utils.valid(sentence)

  // The (MTK) CRC check doesn't report "invalid" if the input string contains the "<" character, even though it actually isn't valid.
  if (sentence.includes('<')) {
    valid = false
  }

  if (valid === false) {
    emitter.emit('warning', { message: `Sentence "${sentence.trim()}" is invalid` })
    return Promise.reject(new Error(`Sentence "${sentence.trim()}" is invalid`))
  }

  const data = sentence.split('*')[0]
  const dataParts = data.split(',')
  const id = dataParts[0].substr(3, 3).toUpperCase()
  const talker = dataParts[0].substr(1, 2)
  const split = dataParts.slice(1, dataParts.length)
  const hook = findHook(id)

  if (typeof tags.source === 'undefined') {
    tags.source = ':'
  } else {
    tags.source = `${tags.source}:${id}`
  }

  if (hook === false) {
    emitter.emit('warning', { message: `No hook found for "${sentence.trim()}"` })
    return Promise.resolve(null)
  }

  const parser = hook(emitter, {
    id,
    sentence,
    parts: split,
    tags
  })

  if (parser === null || typeof parser !== 'object' || typeof parser.then !== 'function') {
    // debug(`Parser is not a promise... (${typeof parser})`, parser)
    return Promise.resolve(parser)
  }

  return parser.then(data => transformSource(data, id, talker))
}
