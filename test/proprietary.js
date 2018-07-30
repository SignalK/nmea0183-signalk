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
const should = chai.Should()
const nmeaLine = '$PMGNST,02.12,3,T,534,05.0,+03327,00*40'

chai.Should()
chai.use(require('chai-things'))

describe('Proprietary sentences', () => {

  it('Don\'t break the parser', () => {
    const result = new Parser().parseImmediate(nmeaLine)
    should.equal(result, null)
  })

  it('Emit no Signal K data', () => {
    const parser = new Parser()

    parser.on('signalk:delta', delta => {
      done(new Error('Emitted delta for proprietary sentence: ' + JSON.stringify(delta)))
    })

    const result = parser.parseImmediate(nmeaLine)
    should.equal(result, null)
  })
})
