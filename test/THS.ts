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
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()

chai.use(chaiHasItem as any)

describe('THS', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$GPTHS,123.456,A*30') as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.headingTrue'
    )
    delta.updates[0]!.values.length.should.equal(1)
    delta.updates[0]!.values[0]!.value.should.be.closeTo(2.155, 0.005)
  })

  it('Accepts estimated, manual and simulator mode indicators', () => {
    for (const sentence of [
      '$HETHS,90.0,E*10',
      '$HETHS,90.0,M*18',
      '$HETHS,90.0,S*06'
    ]) {
      const delta = new Parser().parse(sentence) as any
      delta.updates[0]!.values[0]!.path.should.equal('navigation.headingTrue')
      delta.updates[0]!.values[0]!.value.should.be.closeTo(Math.PI / 2, 0.001)
    }
  })

  it('Returns null when mode indicator is V (data not valid)', () => {
    const delta = new Parser().parse('$HETHS,123.456,V*3D') as any
    should.equal(delta, null)
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$SKTHS,,*57') as any
    should.equal(delta, null)
  })
})
