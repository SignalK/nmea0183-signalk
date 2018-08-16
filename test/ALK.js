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

const heading = '$STALK,84,B6,10,00,00,00,00,00,00*14'
const standby = '$STALK,84,E6,15,00,00,00,00,00,08*1E'
const auto = '$STALK,84,56,5E,79,02,00,00,00,08*16'
const wind = '$STALK,84,06,00,00,04,00,00,00,00*63'
const route = '$STALK,84,06,00,00,08,00,00,00,00*6F'
const rudder = '$STALK,84,06,00,00,08,00,FE,00,00*6C'
const heading_nineC = '$STALK,9C,51,1E,00*4B'

const should = chai.Should()
chai.use(require('chai-things'))

describe('ALK', () => {
  it('0x84 heading converted', () => {
    const delta = new Parser().parse(heading)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(5.305800926062761, 0.0005)
  })

  it('0x84 ap mode: standby converted', () => {
    const delta = new Parser().parse(standby)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[1].value.should.equal('standby')
  })

  it('0x84 ap mode: auto converted', () => {
    const delta = new Parser().parse(auto)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.target.headingMagnetic')
    delta.updates[0].values[1].value.should.be.closeTo(2.626720524251466, 0.0005)

    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[2].value.should.equal('auto')
  })

  it('0x84 ap mode: wind converted', () => {
    const delta = new Parser().parse(wind)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[0].value.should.equal('wind')
  })

  it('0x84 ap mode: route converted', () => {
    const delta = new Parser().parse(route)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[0].value.should.equal('route')
  })

  it('0x84 rudder angle converted', () => {
    const delta = new Parser().parse(rudder)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.rudderAngle')
    delta.updates[0].values[0].value.should.be.closeTo(-0.03490658503988659, 0.0005)
  })

  it('0x9C ap target heading  converted', () => {
    const delta = new Parser().parse(heading_nineC)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(2.6529004630313806, 0.0005)
  })

  it('Doesn\'t choke on empty 0x9C sentences', () => {
    const delta = new Parser().parse('$STALK,9C,,,*3B')
    should.equal(delta, null)
  })

  it('Doesn\'t choke on empty 0x84 sentences', () => {
    const delta = new Parser().parse('$STALK,84,,,,,,,,*61')
    should.equal(delta, null)
  })
})
