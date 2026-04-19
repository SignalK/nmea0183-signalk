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

const nmeaLine = '$IIRSA,10.5,A,,V*4D'

chai.Should()
chai.use(chaiHasItem as any)

describe('RSA', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine) as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'steering.rudderAngle'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(
      (10.5 / 180) * Math.PI,
      0.1
    )
  })

  it('Returns null when status is V (invalid)', () => {
    const delta = new Parser().parse('$RIRSA,10.0,V*12') as any
    ;(delta === null).should.equal(true)
  })
})
