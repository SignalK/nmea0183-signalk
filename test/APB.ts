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
const should = chai.Should()
const expect = chai.expect

chai.Should()

describe('APB', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C'
    ) as any
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.crossTrackError'
    )!.value.should.be.closeTo(-185.2, 0.001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.bearingTrackMagnetic'
    )!.value.should.be.closeTo(0.19198621776321237, 0.000001)
    delta.updates[0]!.values.find(
      (x: any) =>
        x.path === 'navigation.courseRhumbline.bearingToDestinationMagnetic'
    )!.value.should.be.closeTo(0.19198621776321237, 0.000001)
    // Spec path for present-position-to-destination bearing (emitted alongside
    // the legacy `bearingToDestinationMagnetic` for backwards compatibility).
    delta.updates[0]!.values.find(
      (x: any) =>
        x.path === 'navigation.courseRhumbline.nextPoint.bearingMagnetic'
    )!.value.should.be.closeTo(0.19198621776321237, 0.000001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.nextPoint.ID'
    )!.value.should.equal('DEST')
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'steering.autopilot.target.headingMagnetic'
    )!.value.should.closeTo(0.19198621776321237, 0.0001)
    expect(
      delta.updates[0]!.values.find(
        (x: any) => x.path === 'notifications.arrivalCircleEntered'
      ).value
    ).to.be.null
    expect(
      delta.updates[0]!.values.find(
        (x: any) => x.path === 'notifications.perpendicularPassed'
      ).value
    ).to.be.null
  })

  it('True-bearing variant emits nextPoint.bearingTrue (spec path) alongside legacy bearingToDestinationTrue', () => {
    const delta = new Parser().parse(
      '$GPAPB,A,A,0.10,R,N,V,V,011,T,DEST,011,T,011,T*25'
    ) as any
    delta.updates[0]!.values.find(
      (x: any) =>
        x.path === 'navigation.courseRhumbline.bearingToDestinationTrue'
    )!.value.should.be.closeTo(0.19198621776321237, 0.000001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.nextPoint.bearingTrue'
    )!.value.should.be.closeTo(0.19198621776321237, 0.000001)
  })

  // Each of parts[0..4] being individually empty must short-circuit to null,
  // locking the guard against accidental loosening.
  ;[
    ['parts[0] empty', '$GPAPB,,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*7D'],
    ['parts[1] empty', '$GPAPB,A,,0.10,R,N,V,V,011,M,DEST,011,M,011,M*7D'],
    ['parts[2] empty', '$GPAPB,A,A,,R,N,V,V,011,M,DEST,011,M,011,M*23'],
    ['parts[3] empty', '$GPAPB,A,A,0.10,,N,V,V,011,M,DEST,011,M,011,M*6E'],
    ['parts[4] empty', '$GPAPB,A,A,0.10,R,,V,V,011,M,DEST,011,M,011,M*72']
  ].forEach(([label, sentence]: any) => {
    it(`Returns null when ${label}`, () => {
      should.equal(new Parser().parse(sentence), null)
    })
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPAPB,,,,,,,,,,,,,,*44') as any
    should.equal(delta, null)
  })

  it('Void LORAN-C blink/SNR warning (parts[0]=V) throws', () => {
    ;(() =>
      new Parser().parse(
        '$GPAPB,V,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*2B'
      )).should.throw(/LORAN-C blink/)
  })

  it('Void LORAN-C cycle warning (parts[1]=V) throws', () => {
    ;(() =>
      new Parser().parse(
        '$GPAPB,A,V,0.10,R,N,V,V,011,M,DEST,011,M,011,M*2B'
      )).should.throw(/LORAN-C cycle/)
  })

  it('L direction flips the XTE sign (positive)', () => {
    const delta = new Parser().parse(
      '$GPAPB,A,A,0.10,L,N,A,A,011,M,DEST,011,M,011,M*22'
    ) as any
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.courseRhumbline.crossTrackError'
    )!.value.should.be.greaterThan(0)
  })

  it('Km units and arrival-circle / perpendicular-passed alarms emit notifications', () => {
    const delta = new Parser().parse(
      '$GPAPB,A,A,0.10,R,K,A,A,011,M,DEST,011,M,011,M*39'
    ) as any
    const arrival = delta.updates[0]!.values.find(
      (v: any) => v.path === 'notifications.arrivalCircleEntered'
    ).value
    arrival.state.should.equal('alarm')
    arrival.message.should.match(/WP arrival/)
    const perp = delta.updates[0]!.values.find(
      (v: any) => v.path === 'notifications.perpendicularPassed'
    ).value
    perp.state.should.equal('alarm')
    perp.message.should.match(/Perpendicular/)
  })
})
