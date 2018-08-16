/**
 * Copyright 2016 Signal K and contributors.
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

'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))

describe('VHW', () => {
  it('speed data only', () => {
    const delta = new Parser().parse('$IIVHW,,T,,M,06.12,N,11.33,K*50')

    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedThroughWater')
    delta.updates[0].values[0].value.should.be.closeTo(3.148400797594869, 0.005)
  })

  it('speed & direction data', () => {
    const delta = new Parser().parse('$SDVHW,182.5,T,181.8,M,0.0,N,0.0,K*4C')

    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedThroughWater')
    delta.updates[0].values[2].value.should.be.closeTo(0, 0.00005)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
    delta.updates[0].values[1].value.should.be.closeTo(3.1730085801256913, 0.00005)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingTrue')
    delta.updates[0].values[0].value.should.be.closeTo(3.1852258848896517, 0.00005)
  })

  /* FIXME!
  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIRPM,,,,,*63')
    should.equal(delta, null)
  }) */
})
