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

chai.use(require('chai-things'))

describe('DPT', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.depth.belowTransducer')
      delta.updates[0].values.should.contain.an.item.with.property('value', 4.1)
      done()
    })

    parser.parse('$IIDPT,4.1,0.0*45')
  })

  it('Converts OK with missing offset', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values[0].path.should.equal('environment.depth.belowTransducer')
      delta.updates[0].values[0].value.should.equal(4.1)
      done()
    })

    parser.parse('$IIDPT,4.1,*6B')
  })

  it('Converts OK with positive offset', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.depth.belowTransducer')
      delta.updates[0].values.should.contain.an.item.with.property('value', 4.1)

      delta.updates[0].values[1].path.should.equal('environment.depth.surfaceToTransducer')
      delta.updates[0].values[1].value.should.equal(1)

      delta.updates[0].values[2].path.should.equal('environment.depth.belowSurface')
      delta.updates[0].values[2].value.should.equal(5.1)
      done()
    })

    parser.parse('$IIDPT,4.1,1.0*44')
  })

  it('Converts OK with negative offset', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values[0].path.should.equal('environment.depth.belowTransducer')
      delta.updates[0].values[0].value.should.be.closeTo(4.1, 0.1)

      delta.updates[0].values[1].path.should.equal('environment.depth.transducerToKeel')
      delta.updates[0].values[1].value.should.equal(1)

      delta.updates[0].values[2].path.should.equal('environment.depth.belowKeel')
      delta.updates[0].values[2].value.should.be.closeTo(3.1, 0.1)
      done()
    })

    parser.parse('$IIDPT,4.1,-1.0*69')
  })

  it('Doesn\'t choke on empty sentences', () => {
    const result = new Parser().parseImmediate('$IIDPT,,,*6C')
    should.equal(result, null)
  })
})
