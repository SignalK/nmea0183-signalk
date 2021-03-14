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
const defaultHooks = require('../hooks')
const pkg = require('../package.json')
const debug = require('debug')('signalk-parser-nmea0183')

class Parser {
  constructor(opts = {
    emitPropertyValue: () => undefined,
    onPropertyValues: () => undefined
  }) {
    this.options = (typeof opts === 'object' && opts !== null) ? opts : {}
    if (!Object.keys(this.options).includes('validateChecksum')) {
      this.options.validateChecksum = true
    }
    this.session = {}

    this.name = pkg.name
    this.version = pkg.version
    this.author = pkg.author
    this.license = pkg.license
    this.hooks = { ...defaultHooks }

    opts.onPropertyValues && opts.onPropertyValues('nmea0183sentenceParser', propertyValues_ => {
      if (propertyValues_ === undefined) {
        return
      }
      const propValues = propertyValues_.filter(v => v)
        .map(propValue => propValue.value)
        .filter(isValidSentenceParserEntry)
        .map(({ sentence, parser }) => {
          debug(`setting custom parser ${sentence}`)
          this.hooks[sentence] = parser })
    })
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

    let valid = utils.valid(sentence, this.options.validateChecksum)

    if (valid === false) {
      throw new Error(`Sentence "${sentence.trim()}" is invalid`)
    }

    if (sentence.charCodeAt(sentence.length - 1) === 10) {
      // in case there's a newline
      sentence = sentence.substr(0, sentence.length - 1)
    }

    const data = sentence.split('*')[0]
    const dataParts = data.split(',')
    let id = ''
    let talker = ''
    let internalId = ''

    if (dataParts[0].charAt(1).toUpperCase() === 'P') { // proprietary sentence
      id = dataParts[0].substr(-3, dataParts[0].length).toUpperCase()
      talker = dataParts[0].substr(1, 2).toUpperCase()
      internalId = dataParts[0].substr(1, dataParts[0].length)
    } else {
      id = dataParts[0].substr(3, 3).toUpperCase()
      talker = dataParts[0].substr(1, 2)
      internalId = id
    }
    const split = dataParts.slice(1, dataParts.length)

    if (typeof tags.source === 'undefined') {
      tags.source = ':'
    } else {
      tags.source = `${tags.source}:${id}`
    }

    if (typeof this.hooks[internalId] === 'function') {
      const result = this.hooks[internalId]({
        id,
        sentence,
        parts: split,
        tags
      }, this.session)
      return transformSource(result, id, talker)
    } else {
      return null
    }
  }
}

function isValidSentenceParserEntry(entry) {
  const isValid = typeof entry.sentence === 'string' && typeof entry.parser === 'function'
  if (!isValid) {
    console.error(`Invalid sentence parser entry:${JSON.stringify(entry)}`)
  }
  return isValid
}

module.exports = Parser
