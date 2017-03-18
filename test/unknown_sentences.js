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

const Parser = require('../lib')
const chai = require('chai')
const nmeaLog = require('./logs/unrecognised.js')

chai.Should()
chai.use(require('chai-things'))

describe('Unknown sentences', () => {

  it('Stream parser continues, even after it encounters an unknown sentence', done => {
    const parser = new Parser
    const stream = parser.stream()
    const knownSentences = 13
    let count = 0

    stream.on('data', result => {
      ++count
      // console.log(`  *** LINE ${count}/${knownSentences} (of ${nmeaLog.length}):`, JSON.stringify(result))

      if (count >= knownSentences) {
        count.should.equal(knownSentences)
        done()
      }
    })

    nmeaLog.forEach(nmeaLine => {
      stream.write(nmeaLine)
    })
  })

})
