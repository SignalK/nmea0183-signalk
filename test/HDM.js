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

describe('HDM', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$04HDM,186.5,M*2C')

    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.headingMagnetic'
    )
    delta.updates[0].values[0].value.should.be.closeTo(3.26, 0.005)
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$SKHDM,,*59')
    should.equal(delta, null)
  })
})
