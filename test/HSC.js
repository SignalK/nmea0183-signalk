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

chai.Should()
chai.use(require('chai-things'))

describe('HSC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$FTHSC,40.12,T,39.11,M*5E')
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'steering.autopilot.target.headingTrue'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'value',
      0.7002260960600073
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'steering.autopilot.target.headingMagnetic'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'value',
      0.6825982706108397
    )
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$FTHSC,,,,*4A')
    should.equal(delta, null)
  })
})
