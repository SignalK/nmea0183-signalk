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
import * as signalkSchema from '@signalk/signalk-schema'
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()

chai.use(chaiHasItem as any)
chai.use(signalkSchema.chaiModule as any)

describe('RMB', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,001,002,4653.550,N,07115.984,W,2.505,334.205,0.000,V*04'
    ) as any
    should.equal(delta.updates[0]!.timestamp, undefined)

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.nextPoint.position'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.nextPoint.distance'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.nextPoint.bearingTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.nextPoint.velocityMadeGood'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.crossTrackError'
    )
    delta.updates[0]!.values[0]!.value.latitude.should.be.closeTo(
      46.8925,
      0.005
    )
    delta.updates[0]!.values[0]!.value.longitude.should.be.closeTo(
      -71.2664,
      0.005
    )
    delta.updates[0]!.values[1]!.value.should.be.closeTo(5.832, 0.005)
    delta.updates[0]!.values[2]!.value.should.be.closeTo(0, 0.005)
    delta.updates[0]!.values[3]!.value.should.be.closeTo(4639.26, 0.005)
    delta.updates[0]!.values[4]!.value.should.equal(0)

    delta.updates[0]!.values.should.containItemMatching({
      path: 'navigation.courseRhumbline.nextPoint.ID',
      value: '002'
    })
    delta.updates[0]!.values.should.containItemMatching({
      path: 'navigation.courseRhumbline.previousPoint.ID',
      value: '001'
    })
  })

  it('crossTrackError should be negative to steer right', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.432,R,001,002,4653.550,N,07115.984,W,2.505,334.205,0.000,V*1F'
    ) as any
    delta.updates[0]!.values[4]!.value.should.be.closeTo(-800.064, 0.005)
  })

  it('crossTrackError should be positive to steer left', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.432,L,001,002,4653.550,N,07115.984,W,2.505,334.205,0.000,V*01'
    ) as any
    delta.updates[0]!.values[4]!.value.should.be.closeTo(800.064, 0.005)
  })

  it('omits waypoint IDs when fields are empty', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,,,4653.550,N,07115.984,W,2.505,334.205,0.000,V*07'
    ) as any
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseRhumbline.nextPoint.ID')
    paths.should.not.include('navigation.courseRhumbline.previousPoint.ID')
  })

  it('includes only destination ID when origin is empty', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,,002,4653.550,N,07115.984,W,2.505,334.205,0.000,V*35'
    ) as any
    delta.updates[0]!.values.should.containItemMatching({
      path: 'navigation.courseRhumbline.nextPoint.ID',
      value: '002'
    })
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseRhumbline.previousPoint.ID')
  })

  it('includes only origin ID when destination is empty', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,001,,4653.550,N,07115.984,W,2.505,334.205,0.000,V*36'
    ) as any
    delta.updates[0]!.values.should.containItemMatching({
      path: 'navigation.courseRhumbline.previousPoint.ID',
      value: '001'
    })
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseRhumbline.nextPoint.ID')
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$ECRMB,,,,,,,,,,,,,*77') as any
    delta.updates[0]!.values.should.containItemMatching({
      path: 'navigation.courseRhumbline.nextPoint.position',
      value: null
    })
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseRhumbline.nextPoint.ID')
    paths.should.not.include('navigation.courseRhumbline.previousPoint.ID')
  })

  it('passes through positive VMG', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,001,002,4653.550,N,07115.984,W,2.505,334.205,3.5,V*02'
    ) as any
    const vmg = delta.updates[0]!.values.find(
      (v: any) =>
        v.path === 'navigation.courseRhumbline.nextPoint.velocityMadeGood'
    ).value
    // 3.5 knots -> ~1.801 m/s
    vmg.should.be.closeTo(1.8006, 0.01)
  })

  it('clamps negative VMG to 0', () => {
    const delta = new Parser().parse(
      '$ECRMB,A,0.000,L,001,002,4653.550,N,07115.984,W,2.505,334.205,-1.5,V*2D'
    ) as any
    const vmg = delta.updates[0]!.values.find(
      (v: any) =>
        v.path === 'navigation.courseRhumbline.nextPoint.velocityMadeGood'
    ).value
    vmg.should.equal(0)
  })
})
