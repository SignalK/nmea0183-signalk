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

describe('DBT', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$IIDBT,035.53,f,010.83,M,005.85,F*23')
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values.should.contain.an.item.with.property('value', 10.83)
  })

  it('Converts with only feet in the sentence', () => {
    const delta = new Parser().parse('$IIDBT,432.8,f,,M,,F*1C')
    delta.updates.length.should.equal(1)
    delta.updates[0].values.length.should.equal(1)
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'value',
      131.91744
    )
  })

  it("Converts empty value to null", () => {
    const delta = new Parser().parse('$IIDBT,,,,,,*52')
    delta.updates[0].values.length.should.equal(1)
    delta.updates[0].values[0].path.should.equal(
      'environment.depth.belowTransducer'
    )
    should.equal(delta.updates[0].values[0].value, null)
  })
})
