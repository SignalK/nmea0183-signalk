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

chai.Should()
chai.use(require('chai-things'))

describe('MTW', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$YXMTW,15.2,C*14')

    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.water.temperature'
    )
    delta.updates[0].values[0].value.should.be.closeTo(288.35, 0.005)
  })

  it('Converts empty value to null', () => {
    const delta = new Parser().parse('$RAMTW,,C*1E')
    delta.updates[0].values.length.should.equal(1)
    delta.updates[0].values[0].path.should.equal(
      'environment.water.temperature'
    )
    chai.expect(delta.updates[0].values[0].value).to.be.null
  })
})
