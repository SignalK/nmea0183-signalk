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

import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'
const expect = chai.expect

chai.Should()
chai.use(chaiHasItem as any)

describe('VTG', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPVTG,0.0,T,359.3,M,0.0,N,0.0,K,A*2F'
    ) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundMagnetic'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(6.271, 0.005)

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0]!.values[1]!.value.should.equal(0)

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0]!.values[2]!.value.should.equal(0)
  })

  it('Outputs nulls for missing values', () => {
    const delta = new Parser().parse('$GPVTG,,T,,M,0.102,N,0.190,K,A*28') as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundMagnetic'
    )
    expect(delta.updates[0]!.values[0]!.value).to.be.null

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    expect(delta.updates[0]!.values[1]!.value).to.be.null

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0]!.values[2]!.value.should.be.closeTo(0.0528, 0.00005)
  })

  it('Uses knots branch when only knots speed is present', () => {
    const delta = new Parser().parse(
      '$GPVTG,0.0,T,359.3,M,15.0,N,,K,A*35'
    ) as any
    const speed = delta.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.speedOverGround'
    ).value
    // 15 knots -> 7.7167 m/s
    speed.should.be.closeTo(7.7167, 0.01)
  })

  it('Returns null when all speed/course values are empty', () => {
    const delta = new Parser().parse('$GPVTG,,,,,,,,,*7E') as any
    ;(delta === null).should.equal(true)
  })
})
