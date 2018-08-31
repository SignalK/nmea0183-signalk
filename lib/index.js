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

const getTagBlock = require('./getTagBlock')
const transformSource = require('./transformSource')
const utils = require('@signalk/nmea0183-utilities')
const hooks = require('../hooks')
const pkg = require('../package.json')

class Parser {
  constructor (opts) {
    this.options = (typeof opts === 'object' && opts !== null) ? opts : {}

    // Default values
    if (!Object.keys(this.options).includes('validateChecksum')) {
      this.options.validateChecksum = true
    }
    if (!Object.keys(this.options).includes('requireChecksum')) {
      this.options.requireChecksum = true
    }
    this.session = {}

    this.name = pkg.name
    this.version = pkg.version
    this.author = pkg.author
    this.license = pkg.license
  }

  parse(sentence) {
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

    let valid = utils.valid(sentence, this.options.validateChecksum, this.options.requireChecksum)
    if (valid === false) {
      throw new Error(`Sentence "${sentence.trim()}" is invalid`)
    }

    if (sentence.charCodeAt(sentence.length-1) == 10 ) {
      //in case there's a newline
      sentence = sentence.substr(0, sentence.length-1)
    }

    const data = sentence.split('*')[0]
    const dataParts = data.split(',')
    const id = dataParts[0].substr(3, 3).toUpperCase()
    const talker = dataParts[0].substr(1, 2)
    const split = dataParts.slice(1, dataParts.length)

    if (typeof tags.source === 'undefined') {
      tags.source = ':'
    } else {
      tags.source = `${tags.source}:${id}`
    }

    if (typeof hooks[id] === 'function') {
      const result = hooks[id]({
        id,
        sentence,
        parts: split,
        tags
      }, this.session)
      return transformSource(result, id, talker)
    }
    else {
      return null
    }
  }
}

module.exports = Parser