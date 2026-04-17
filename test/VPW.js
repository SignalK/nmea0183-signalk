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
const should = chai.Should()
const nmeaLine = '$IIVPW,4.5,N,6.7,M*52'
const nmeaLineKnots = '$IIVPW,5.0,N,,M*79'
const nmeaLineEmpty = '$IIVPW,,N,,M*52'

chai.use(require('./helpers/chai-has-item'))

describe('VPW', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine)
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'performance.velocityMadeGood'
    )
    delta.updates[0].values.should.containItemWithProperty('value', 6.7)
  })

  it('Uses knots when m/s missing', () => {
    const delta = new Parser().parse(nmeaLineKnots)
    const value = delta.updates[0].values.find(
      (v) => v.path === 'performance.velocityMadeGood'
    ).value
    // 5 knots -> 2.5722 m/s
    value.should.be.closeTo(2.5722, 0.01)
  })

  it('Returns null when both knots and m/s are missing', () => {
    const delta = new Parser().parse(nmeaLineEmpty)
    should.equal(delta, null)
  })
})
