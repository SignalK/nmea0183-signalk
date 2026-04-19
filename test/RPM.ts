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

import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'
chai.Should()
chai.use(chaiHasItem as any)

const nmeaLine = '$IIRPM,E,1,2418.2,10.5,A*5F'

describe('RPM', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'propulsion.engine_1.revolutions'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(2418.2 / 60, 0.0005)
  })

  it("Source 'S' maps to propulsion.shaft_<id>", () => {
    const delta = new Parser().parse('$IIRPM,S,2,1800.0,0.0,A*7A') as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'propulsion.shaft_2.revolutions'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(30, 0.0005)
  })

  /* FIXME!
  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIRPM,,,,,*63') as any
    should.equal(delta, null)
  })
  */
})
