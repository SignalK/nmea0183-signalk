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

import Parser from '../src/lib'
import * as chai from 'chai'
import * as signalkSchema from '@signalk/signalk-schema'
import withClock from './helpers/with-clock'
const should = chai.Should()
chai.use(signalkSchema.chaiModule as any)

describe('GLL', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPGLL,5958.613,N,02325.928,E,121022,A,D*40'
    ) as any

    delta.updates[0]!.values[0]!.path.should.equal('navigation.position')
    delta.updates[0]!.values[0]!.value.latitude.should.be.closeTo(
      59.9768833,
      0.000005
    )
    delta.updates[0]!.values[0]!.value.longitude.should.be.closeTo(
      23.432133,
      0.000005
    )
    // delta.should.be.validSignalKDelta
  })

  it('Converts OK using individual parser, invalid lat/lng', () => {
    const delta = new Parser({ validateChecksum: false }).parse(
      // note this malformed lat value is pulled from a real validated malformed RMC example. see test/RMC.js
      '$GPGLL,1547\x0E70800,N,02325.928,E,121022,A,D*40'
    ) as any

    delta.updates[0]!.values[0]!.path.should.equal('navigation.position')
    should.equal(delta.updates[0]!.values[0]!.value, null)
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$GPGLL,,,,,,,*7C') as any
    should.equal(delta, null)
  })

  it('Accepts time with fractional seconds', () => {
    const delta = new Parser().parse(
      '$GPGLL,5958.613,N,02325.928,E,121022.5,A,D*5B'
    ) as any
    delta.updates[0]!.timestamp.slice(11, 19).should.equal('12:10:22')
  })

  it('Returns null when status is V (invalid)', () => {
    const delta = new Parser().parse(
      '$GPGLL,5958.613,N,02325.928,E,121022,V,D*57'
    ) as any
    should.equal(delta, null)
  })

  it('emits a UTC ISO timestamp on the host date for the sentence time', () => {
    const delta = withClock('2026-09-12T12:10:23.000Z', () =>
      new Parser().parse('$GPGLL,5958.613,N,02325.928,E,121022,A,D*40')
    ) as any
    delta.updates[0]!.timestamp.should.equal('2026-09-12T12:10:22.000Z')
  })
})
