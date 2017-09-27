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

chai.Should()
chai.use(require('chai-things'))

describe('ALK', done => {
  it('0x84 heading converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
      delta.updates[0].values[0].value.should.be.closeTo(5.305800926062761, 0.0005)
      done()
    })
    parser.parse(heading)
  })

  it('0x84 ap mode: standby converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
      delta.updates[0].values[1].value.should.equal('standby')
      done()
    })
    parser.parse(standby)
  })

  it('0x84 ap mode: auto converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
      delta.updates[0].values[2].value.should.equal('auto')
      done()
    })
    parser.parse(auto)
  })

  it('0x84 ap mode: wind converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
      delta.updates[0].values[0].value.should.equal('wind')
      done()
    })
    parser.parse(wind)
  })

  it('0x84 ap mode: route converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
      delta.updates[0].values[0].value.should.equal('route')
      done()
    })
    parser.parse(route)
  })

  it('0x84 rudder angle converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.rudderAngle')
      delta.updates[0].values[0].value.should.be.closeTo(-0.03490658503988659, 0.0005)
      done()
    })
    parser.parse(rudder)
  })

  it('0x84 ap target heading  converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.target.headingMagnetic')
      delta.updates[0].values[1].value.should.be.closeTo(2.626720524251466, 0.0005)
      done()
    })
    parser.parse(auto)
  })

  it('0x9C ap target heading  converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
      delta.updates[0].values[0].value.should.be.closeTo(2.6529004630313806, 0.0005)
      done()
    })

    parser.parse(heading_nineC)
  })

/*
  it('Doesn\'t choke on empty sentences', done => {
    const parser = new Parser
    parser
    .parse('$STALK,9C,,,*3B')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })
*/
})
