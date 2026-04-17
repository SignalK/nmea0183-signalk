/**
 * Copyright 2018 Signal K and contributors.
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
const toFull = require('./toFull')
const chai = require('chai')
const should = chai.Should()

chai.use(require('@signalk/signalk-schema').chaiModule)
chai.use(require('./helpers/chai-has-item'))

describe('PNKEP', () => {
  it('Polarspeed data ', () => {
    const delta = new Parser().parse('$PNKEP,01,8.3,N,15.5,K*52')
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'performance.targetSpeed'
    )
    delta.updates[0].values[0].value.should.be.closeTo(
      4.269889970594349,
      0.0005
    )
    toFull(delta).should.be.validSignalK
  })

  it('Course on next track data', () => {
    const delta = new Parser().parse('$PNKEP,02,344.4*6B')

    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'performance.tackMagnetic'
    )
    delta.updates[0].values[0].value.should.be.closeTo(6.0109139439, 0.00005)
    toFull(delta).should.be.validSignalK
  })

  it('Direction data', () => {
    const delta = new Parser().parse('$PNKEP,03,152.0,55.2,67.1*69')

    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'performance.targetAngle'
    )
    delta.updates[0].values[0].value.should.be.closeTo(2.652900463, 0.00005)
    toFull(delta).should.be.validSignalK
  })

  it('Returns null when 01 has no speed data', () => {
    const delta = new Parser().parse('$PNKEP,01,,N,,K*68')
    should.equal(delta, null)
  })

  it('Uses knots when kph is zero for 01', () => {
    const delta = new Parser().parse('$PNKEP,01,8.3,N,0,K*7D')
    delta.updates[0].values[0].value.should.be.closeTo(4.269889970594349, 0.001)
  })

  it('Returns null when 02 has no course', () => {
    const delta = new Parser().parse('$PNKEP,02,*42')
    should.equal(delta, null)
  })

  it('Returns null when 03 has no angle', () => {
    const delta = new Parser().parse('$PNKEP,03,*43')
    should.equal(delta, null)
  })
})
