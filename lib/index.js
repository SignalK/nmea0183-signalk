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
 
const debug = require('debug')('signalk-parser-nmea0183')
const EventEmitter = require('events')
const isObject = require('./types').isObject
const parseSentence = require('./parse')
const StreamParser = require('./StreamParser')

class Parser extends EventEmitter {
  constructor (opts) {
    super()
    this.options = isObject(opts) ? opts : {}
    this.streamParser = null
    this.session = {}
  }

  parse (sentence) {
    return parseSentence(this, sentence)
    .then(result => {
      if (typeof result === 'object' && result !== null) {
        this.emit('signalk:full', result.full || {})
        this.emit('signalk:delta', result.delta || {})
      }

      return result
    })
    .catch(e => {
      this.emit('error', e)
    })
  }
  
  stream () {
    if (this.streamParser === null) {
      const opts = isObject(this.options.stream) ? this.options.stream : {}
      opts.parser = this
      this.streamParser = new StreamParser(opts)
    }
    
    return this.streamParser
  }
  
}

Parser.Parser = StreamParser
module.exports = Parser
