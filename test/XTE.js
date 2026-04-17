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
const should = chai.Should()

chai.Should()

describe('XTE', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$GPXTE,A,A,0.67,L,N*6F')
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values[0].path.should.equal(
      'navigation.courseRhumbline.crossTrackError'
    )
    delta.updates[0].values[0].value.should.be.closeTo(1240.84, 0.001)
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPXTE,,,,,*72')
    should.equal(delta, null)
  })

  it('Void LORAN-C blink/SNR warning (parts[0]=V) throws', () => {
    ;(() => new Parser().parse('$GPXTE,V,A,0.67,L,N*78')).should.throw(
      /LORAN-C blink/
    )
  })

  it('Void LORAN-C cycle warning (parts[1]=V) throws', () => {
    ;(() => new Parser().parse('$GPXTE,A,V,0.67,L,N*78')).should.throw(
      /LORAN-C cycle/
    )
  })

  it('Emits XTE even when magnitude is empty (direction alone is enough)', () => {
    // parts[2] (magnitude) empty, parts[3] (direction) present — guard requires
    // BOTH empty to short-circuit, so we should still get a delta.
    const delta = new Parser().parse('$GPXTE,A,A,,L,N*70')
    delta.should.be.an('object')
    delta.updates[0].values[0].path.should.equal(
      'navigation.courseRhumbline.crossTrackError'
    )
  })

  it('Emits XTE even when direction is empty (magnitude alone is enough)', () => {
    // parts[3] (direction) empty, parts[2] (magnitude) present.
    const delta = new Parser().parse('$GPXTE,A,A,0.67,,N*23')
    delta.should.be.an('object')
    delta.updates[0].values[0].path.should.equal(
      'navigation.courseRhumbline.crossTrackError'
    )
  })

  it('Handles R direction (steer right) and km units', () => {
    const delta = new Parser().parse('$GPXTE,A,A,0.67,R,K*74')
    // R direction: direction = -1, and K units = km
    // 0.67 km = 670 m, negated to -670
    delta.updates[0].values[0].value.should.be.closeTo(-670, 0.1)
  })
})
