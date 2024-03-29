/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
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
const nmeaLine = '$IIVPW,4.5,N,6.7,M*52'
const nmeaLineKnots = '$IIVPW,4.5,N,,*30' // FIXME: add a test for knots?

chai.Should()
chai.use(require('chai-things'))

describe('VPW', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine)
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'performance.velocityMadeGood'
    )
    delta.updates[0].values.should.contain.an.item.with.property('value', 6.7)
  })
})
