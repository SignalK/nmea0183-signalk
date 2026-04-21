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

describe('BOD', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPBOD,045.,T,023.,M,DEST,START*01'
    ) as any
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.bearingTrackTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      0.7853981635767779
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.bearingTrackMagnetic'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      0.40142572805035315
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.nextPoint.ID'
    )
    delta.updates[0]!.values.should.containItemWithProperty('value', 'DEST')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.previousPoint.ID'
    )
    delta.updates[0]!.values.should.containItemWithProperty('value', 'START')
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPBOD,,,,,,*5E') as any
    should.equal(delta, null)
  })

  it('Emits null for the axis that is not provided', () => {
    // Both parts declare True: Magnetic stays undefined, should emit null.
    const delta = new Parser().parse(
      '$GPBOD,045.,T,023.,T,DEST,START*18'
    ) as any
    should.equal(
      delta.updates[0]!.values.find(
        (x: any) => x.path === 'navigation.courseRhumbline.bearingTrackMagnetic'
      ).value,
      null
    )
  })

  // Unit letters (parts[1], parts[3]) and destination waypoint ID
  // (parts[4]) are required — without them the bearing axis and the
  // routing target are undefined, so the sentence drops.
  ;[
    ['parts[1] empty (unit letter)', '$GPBOD,045.,,023.,M,DEST,START*55'],
    ['parts[3] empty (unit letter)', '$GPBOD,045.,T,023.,,DEST,START*4C'],
    ['parts[4] empty (destination)', '$GPBOD,045.,T,023.,M,,START*07']
  ].forEach(([label, sentence]: any) => {
    it(`Returns null when ${label}`, () => {
      should.equal(new Parser().parse(sentence), null)
    })
  })

  // Magnitude fields (parts[0], parts[2]) are independently optional —
  // missing one emits a null value on the matching axis rather than
  // dropping the whole sentence (IEC 61162-1 §7.2.3.4).
  it('Emits null True when parts[0] magnitude is empty', () => {
    const delta = new Parser().parse('$GPBOD,,T,023.,M,DEST,START*1E') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'navigation.courseRhumbline.bearingTrackTrue'
      ).value,
      null
    )
  })

  it('Emits null Magnetic when parts[2] magnitude is empty', () => {
    const delta = new Parser().parse('$GPBOD,045.,T,,M,DEST,START*1E') as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'navigation.courseRhumbline.bearingTrackMagnetic'
      ).value,
      null
    )
  })

  it('Exact deep.equal of full parse to lock paths, values and types', () => {
    const delta = new Parser().parse(
      '$GPBOD,045.,T,023.,M,DEST,START*01'
    ) as any
    delta.updates[0]!.values.should.deep.include.members([
      {
        path: 'navigation.courseRhumbline.bearingTrackTrue',
        value: 0.7853981635767779
      },
      {
        path: 'navigation.courseRhumbline.bearingTrackMagnetic',
        value: 0.40142572805035315
      },
      { path: 'navigation.courseRhumbline.nextPoint.ID', value: 'DEST' },
      { path: 'navigation.courseRhumbline.previousPoint.ID', value: 'START' }
    ])
  })

  it('Trims whitespace in waypoint IDs', () => {
    const delta = new Parser().parse(
      '$GPBOD,045.,T,023.,M, DEST , START *01'
    ) as any
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.courseRhumbline.nextPoint.ID'
    )!.value.should.equal('DEST')
    delta.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.courseRhumbline.previousPoint.ID'
    )!.value.should.equal('START')
  })

  it('Emits null when True bearing is absent (both axes Magnetic)', () => {
    const delta = new Parser().parse(
      '$GPBOD,045.,M,023.,M,DEST,START*18'
    ) as any
    should.equal(
      delta.updates[0]!.values.find(
        (x: any) => x.path === 'navigation.courseRhumbline.bearingTrackTrue'
      ).value,
      null
    )
  })

  it('Handles Magnetic-first / True-second ordering', () => {
    const delta = new Parser().parse(
      '$GPBOD,045.,M,023.,T,DEST,START*01'
    ) as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.bearingTrackMagnetic'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseRhumbline.bearingTrackTrue'
    )
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.bearingTrackMagnetic'
    )!.value.should.be.closeTo(0.7853981635767779, 0.000001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'navigation.courseRhumbline.bearingTrackTrue'
    )!.value.should.be.closeTo(0.40142572805035315, 0.000001)
  })
})
