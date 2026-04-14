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
chai.use(require('@signalk/signalk-schema').chaiModule)

describe('GLL', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPGLL,5958.613,N,02325.928,E,121022,A,D*40',
    )

    delta.updates[0].values[0].path.should.equal('navigation.position')
    delta.updates[0].values[0].value.latitude.should.be.closeTo(
      59.9768833,
      0.000005,
    )
    delta.updates[0].values[0].value.longitude.should.be.closeTo(
      23.432133,
      0.000005,
    )
    // delta.should.be.validSignalKDelta
  })

  it('Converts OK using individual parser, invalid lat/lng', () => {
    const delta = new Parser({ validateChecksum: false }).parse(
      // note this malformed lat value is pulled from a real validated malformed RMC example. see test/RMC.js
      '$GPGLL,1547\x0E70800,N,02325.928,E,121022,A,D*40',
    )

    delta.updates[0].values[0].path.should.equal('navigation.position')
    should.equal(delta.updates[0].values[0].value, null)
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$GPGLL,,,,,,,*7C')
    should.equal(delta, null)
  })

  it('emits a UTC ISO timestamp matching today and the sentence time', () => {
    // before/after window tolerates a test run straddling midnight UTC
    const before = new Date().toISOString().slice(0, 10)
    const delta = new Parser().parse(
      '$GPGLL,5958.613,N,02325.928,E,121022,A,D*40',
    )
    const after = new Date().toISOString().slice(0, 10)

    const ts = delta.updates[0].timestamp
    ts.should.be.a('string')
    ts.should.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/)
    // "121022" -> 12:10:22
    ts.slice(11, 19).should.equal('12:10:22')
    ts.slice(0, 10).should.be.oneOf([before, after])
  })
})
