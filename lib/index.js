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

const EventEmitter = require('events')
const isObject = require('./types').isObject
const parseSentence = require('./parse')
const pkg = require('../package.json')

class Parser extends EventEmitter {
  constructor (opts) {
    super()
    this.options = isObject(opts) ? opts : {}
    this.session = {}

    this.name = pkg.name
    this.version = pkg.version
    this.author = pkg.author
    this.license = pkg.license
  }

  parse (sentence) {
    if (typeof sentence === 'string' && sentence.trim().length > 0) {
      this.emit('nmea0183', sentence.trim())
    }

    try {
      var result = parseSentence(this, sentence, this.options)
      if (typeof result === 'object' && result !== null) {
        this.emit('signalk:delta', result || {})
      }
      // Return value kept for backwards compatibility.
      if (result !== null) {
        return Promise.resolve({ delta: result })
      }
      else {
        return Promise.resolve(null)
      }
    }
    catch(e) {
      return Promise.reject(e)
    }
  }
}

module.exports = Parser
