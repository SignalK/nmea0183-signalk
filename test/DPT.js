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
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$IIDPT,4.1,0.0*45')
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values.should.contain.an.item.with.property('value', 4.1)
  })

  it('Converts OK with missing offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,*6B')
    delta.updates[0].values[0].path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values[0].value.should.equal(4.1)
  })

  it('Converts OK with positive offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,1.0*44')

    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values.should.contain.an.item.with.property('value', 4.1)

    delta.updates[0].values[1].path.should.equal(
      'environment.depth.surfaceToTransducer'
    )
    delta.updates[0].values[1].value.should.equal(1)

    delta.updates[0].values[2].path.should.equal(
      'environment.depth.belowSurface'
    )
    delta.updates[0].values[2].value.should.equal(5.1)
  })

  it('Converts OK with negative offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,-1.0*69')

    delta.updates[0].values[0].path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values[0].value.should.be.closeTo(4.1, 0.1)

    delta.updates[0].values[1].path.should.equal(
      'environment.depth.transducerToKeel'
    )
    delta.updates[0].values[1].value.should.equal(1)

    delta.updates[0].values[2].path.should.equal('environment.depth.belowKeel')
    delta.updates[0].values[2].value.should.be.closeTo(3.1, 0.1)
  })

  it("Converts empty depth to null", () => {
    const delta = new Parser().parse('$IIDPT,,,*6C')
    delta.updates[0].values[0].path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values.length.should.equal(1)
    should.equal(delta.updates[0].values[0].value, null)
  })

  it("Converts empty depth to null and still outputs offset", () => {
    const delta = new Parser().parse('$IIDPT,,0.1*6F')
    delta.updates[0].values.length.should.equal(2)
    delta.updates[0].values[0].path.should.equal(
      'environment.depth.belowTransducer'
    )
    should.equal(delta.updates[0].values[0].value, null)
    delta.updates[0].values[1].path.should.equal(
      'environment.depth.surfaceToTransducer'
    )
    should.equal(delta.updates[0].values[1].value, 0.1)
  })

})
