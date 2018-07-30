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
const _ = require('lodash')

module.exports = function parseSentence(emitter, sentence, options) {
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

  let validateChecksum = _.isUndefined(options) ||
      _.isUndefined(options.validateChecksum)  || options.validateChecksum

  let valid = utils.valid(sentence, validateChecksum)

  if (valid === false) {
    emitter.emit('warning', { message: `Sentence "${sentence.trim()}" is invalid` })
    // FIXME: Do we really want an exception (or Promise.reject) here?
    // I think returning null would be more coherent.
    throw new Error(`Sentence "${sentence.trim()}" is invalid`)
  }

  if ( sentence.charCodeAt(sentence.length-1) == 10 ) {
    //in case there's a newline
    sentence = sentence.substr(0, sentence.length-1)
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

  if (!hook) {
    emitter.emit('warning', { message: `No hook found for "${sentence.trim()}"` })
    return null
  }

  const result = hook(emitter, {
    id,
    sentence,
    parts: split,
    tags
  })
  return transformSource(result, id, talker)
}