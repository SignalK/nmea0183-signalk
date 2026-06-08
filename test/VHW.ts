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
chai.Should()

chai.use(chaiHasItem as any)

describe('VHW', () => {
  const findValue = (delta: any, path: string) =>
    delta.updates[0]!.values.find((v: any) => v.path === path).value

  it('speed data only — missing headings emit null, not absent', () => {
    const delta = new Parser().parse('$IIVHW,,T,,M,06.12,N,11.33,K*50') as any
    findValue(delta, 'navigation.speedThroughWater').should.be.closeTo(
      3.148400797594869,
      0.005
    )
    chai.expect(findValue(delta, 'navigation.headingTrue')).to.be.null
    chai.expect(findValue(delta, 'navigation.headingMagnetic')).to.be.null
  })

  it('speed & direction data', () => {
    const delta = new Parser().parse(
      '$SDVHW,182.5,T,181.8,M,0.0,N,0.0,K*4C'
    ) as any
    findValue(delta, 'navigation.speedThroughWater').should.be.closeTo(
      0,
      0.00005
    )
    findValue(delta, 'navigation.headingMagnetic').should.be.closeTo(
      3.1730085801256913,
      0.00005
    )
    findValue(delta, 'navigation.headingTrue').should.be.closeTo(
      3.1852258848896517,
      0.00005
    )
  })

  it("Doesn't choke on empty sentences (all fields empty returns null)", () => {
    const delta = new Parser().parse('$IIVHW,,T,,M,,N,,K*55') as any
    ;(delta === null).should.equal(true)
  })
})
