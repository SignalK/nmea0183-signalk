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

const debug = require('debug')('signalk-parser-nmea0183/SteamParser')
const Transform = require('stream').Transform
const isObject = require('./types').isObject

class StreamParser extends Transform {
  constructor (opts) {
    opts = isObject(opts) ? opts : {}
    opts.objectMode = true
    super(opts)

    this.options = isObject(opts) ? opts : {}
    this.options.objectMode = true
    this.parser = this.options.parser
    this.buffer = ''
  }

  _transform (chunk, encoding, done) {
    if (Buffer.isBuffer(chunk)) {
      chunk = chunk.toString()
    }

    this.buffer += chunk
    this.buffer = this.buffer.replace(/\\r\\n/g, '\n')

    if (this.buffer.indexOf('\n') !== -1 
      || (this.buffer.indexOf('\n') === -1 && this.buffer.indexOf('$') !== -1 && this.buffer.indexOf('*') !== -1) 
      || (this.buffer.indexOf('\n') === -1 && this.buffer.indexOf('!') !== -1 && this.buffer.indexOf('*') !== -1)) {
      
      let split = this.buffer.split('\n')
      let unfinished = ''
      let lines = []

      split.forEach(line => {
        line = line.trim()

        if (line !== '') {
          if (this._isSentenceStart(line)) {
            if (line.charAt(line.length - 3) === '*') {
              lines.push(line)
            } else {
              unfinished = line
            }
          } else {
            unfinished += line
          }
        }

        unfinished = unfinished.trim()
        
        if (unfinished !== '' && this._isSentenceStart(unfinished) && unfinished.charAt(unfinished.length - 3) === '*') {
          lines.push(unfinished)
        }
      })

      const lastLine = split[split.length - 1].trim()

      if (this._isSentenceStart(lastLine) && lastLine.charAt(split[split.length - 1].length - 3) !== '*') {
        this.buffer = lastLine
      } else {
        this.buffer = ''
      }

      if (lines.length === 0) {
        return done()
      }

      lines.forEach(line => {
        this
        .parser
        .parse(line.trim())
        .then(result => {
          this.push(result)
          done()
        })
        .catch(err => {
          debug(`Error parsing line (${line}): ${err.message}`)
          this.parser.emit('warning', `[stream] error parsing line (${line}): ${err.message}`)
          done()
        })
      })
    } else {
      done()
    }
  }

  _flush (done) {
    done()
  }

  _isSentenceStart (line) {
    return (line.charAt(0) === '$' || line.charAt(0) === '!' || line.charAt(0) === '\\')
  }
}

module.exports = StreamParser
