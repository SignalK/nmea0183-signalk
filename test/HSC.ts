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
const should = chai.Should()

chai.Should()
chai.use(chaiHasItem as any)

describe('HSC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$FTHSC,40.12,T,39.11,M*5E') as any
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'steering.autopilot.target.headingTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      0.7002260960600073
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'steering.autopilot.target.headingMagnetic'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      0.6825982706108397
    )
  })
  // Unit letters (parts[1], parts[3]) are required — they identify
  // which axis each magnitude belongs to. Missing one drops the
  // sentence.
  ;[
    ['parts[1] empty (unit letter)', '$FTHSC,40.12,,39.11,M*0A'],
    ['parts[3] empty (unit letter)', '$FTHSC,40.12,T,39.11,*13']
  ].forEach(([label, sentence]: any) => {
    it(`Returns null when ${label}`, () => {
      should.equal(new Parser().parse(sentence), null)
    })
  })

  // Magnitude fields (parts[0], parts[2]) are independently optional —
  // one missing emits that axis as null, not a dropped sentence.
  it('Emits null True when parts[0] magnitude is empty', () => {
    const delta = new Parser().parse('$FTHSC,,T,39.11,M*77') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'steering.autopilot.target.headingTrue'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'steering.autopilot.target.headingMagnetic'
    ).value.should.be.closeTo(0.6825982706108397, 1e-6)
  })

  it('Emits null Magnetic when parts[2] magnitude is empty', () => {
    const delta = new Parser().parse('$FTHSC,40.12,T,,M*7A') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'steering.autopilot.target.headingMagnetic'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'steering.autopilot.target.headingTrue'
    ).value.should.be.closeTo(0.7002260960600073, 1e-6)
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$FTHSC,,,,*4A') as any
    should.equal(delta, null)
  })

  it('Emits null for the axis not provided', () => {
    // Both parts declare True: Magnetic stays undefined → null fallback kicks in.
    const delta = new Parser().parse('$FTHSC,40.12,T,39.11,T*47') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'steering.autopilot.target.headingMagnetic'
      ).value,
      null
    )
  })

  it('Emits null when True axis is missing (both parts Magnetic)', () => {
    const delta = new Parser().parse('$FTHSC,40.12,M,39.11,M*47') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'steering.autopilot.target.headingTrue'
      ).value,
      null
    )
  })

  it('Handles reversed Magnetic/True ordering', () => {
    const delta = new Parser().parse('$FTHSC,40.12,M,39.11,T*5E') as any
    const magnetic = delta.updates[0]!.values.find(
      (v: any) => v.path === 'steering.autopilot.target.headingMagnetic'
    ).value
    const trueHeading = delta.updates[0]!.values.find(
      (v: any) => v.path === 'steering.autopilot.target.headingTrue'
    ).value
    magnetic.should.be.closeTo(0.7002260960600073, 1e-6)
    trueHeading.should.be.closeTo(0.6825982706108397, 1e-6)
  })
})
