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
const should = chai.Should()
chai.use(chaiHasItem as any)

describe('VWR', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$IIVWR,75,R,1.0,N,0.51,M,1.85,K*6C'
    ) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.angleApparent'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      1.30899693929463
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.speedApparent'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      0.5144445747704034
    )
  })

  it('Handles shorter valid sentences', () => {
    const delta = new Parser().parse('$IIVWR,024,L,018,N,,,,*5e') as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.angleApparent'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      -0.41887902057428156
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.speedApparent'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      9.260002345867262
    )
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$IIVWR,,,,,,,,*53') as any
    should.equal(delta, null)
  })

  // IEC 61162-1 §7.2.3.4: a null field is a per-field "not available"
  // marker. A sensor reporting only speed (no direction) or only angle
  // (no magnitude) must still surface the present half; the missing
  // half is emitted as `null`, not `0`.
  it('Emits null angle when the L/R direction letter is missing but speed is present', () => {
    const delta = new Parser().parse('$IIVWR,,,1.0,N,,,,*32') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'environment.wind.angleApparent'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'environment.wind.speedApparent'
    ).value.should.be.closeTo(0.5144, 1e-3)
  })

  it('Emits null speed when the speed field is missing but angle is present', () => {
    const delta = new Parser().parse('$IIVWR,75,R,,,,,,*03') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'environment.wind.speedApparent'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'environment.wind.angleApparent'
    ).value.should.be.closeTo(1.3089, 1e-3)
  })
})
