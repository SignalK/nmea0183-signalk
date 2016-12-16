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
const nmeaLine = '$GPROT,35.6,A*01'

chai.Should()
chai.use(require('chai-things'))

describe('ROT', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.rateOfTurn')
      delta.updates[0].values.should.contain.an.item.with.property('value', (35.6 / 180 * Math.PI / 60))
      done()
    })

    parser.parse(nmeaLine)
  })

  it('Converts OK using stream parser', done => {
    const parser = new Parser
    const stream = parser.stream()

    stream.on('data', result => {
      result.should.be.an.object
      result.should.have.property('delta')
      result.delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.rateOfTurn')
      result.delta.updates[0].values.should.contain.an.item.with.property('value', (35.6 / 180 * Math.PI / 60))
      done()
    })

    stream.write(nmeaLine)
  })

})
