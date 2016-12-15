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
 
const debug = require('debug')('signalk-parser-nmea0183/getTagBlock')
const moment = require('moment-timezone')
const tags = ['s:', 'c:']

module.exports = function getTagBlock(sentence) {
  let split = []
  let block = []
  let tags = {}

  // There could be a tag block...
  if (sentence.charAt(0) === '\\') {
    split = sentence.split('\\')
    split = split.filter(part => {
      if (part.trim() === '') {
        return false
      }
      return true
    })
  }

  if (split.length < 2) {
    return false
  }

  if (split[1].trim().charAt(0) === '$' || split[1].trim().charAt(0) === '!') {
    sentence = split[1].trim()
    block = split[0].trim().split(',')
  }

  block.forEach(t => {
    if (t.indexOf('c:') !== -1) {
      tags.timestamp = parseInt(t.replace('c:', '').split('*')[0], 10)
    }

    if (t.indexOf('s:') !== -1) {
      tags.source = t.replace('s:', '')
    }
  })

  if (typeof tags.timestamp === 'number') {
    let len = String(tags.timestamp).length

    if (len <= 12) {
      tags.timestamp *= 1000 
    }

    tags.timestamp = moment.tz(tags.timestamp, 'UTC').toISOString()
  }

  return {
    sentence,
    tags
  }
}
