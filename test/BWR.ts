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

chai.Should()

describe('BWR', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPBWR,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*38'
    ) as any
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0]!.values.should.deep.equal([
      {
        path: 'navigation.courseRhumbline.bearingTrackTrue',
        value: 0.9058258819918839
      },
      {
        path: 'navigation.courseRhumbline.bearingTrackMagnetic',
        value: 0.5515240437561374
      },
      {
        path: 'navigation.courseRhumbline.nextPoint.distance',
        value: 2407.6000020320143
      },
      {
        path: 'navigation.courseRhumbline.nextPoint.position',
        value: {
          latitude: 49.287333333333336,
          longitude: -123.1595
        }
      }
    ])
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPBWR,,,,,,,,,,,,*50') as any
    delta.updates[0]!.values.should.deep.equal([
      { path: 'navigation.courseRhumbline.bearingTrackTrue', value: null },
      {
        path: 'navigation.courseRhumbline.bearingTrackMagnetic',
        value: null
      },
      {
        path: 'navigation.courseRhumbline.nextPoint.distance',
        value: null
      },
      {
        path: 'navigation.courseRhumbline.nextPoint.position',
        value: null
      }
    ])
  })

  it('Returns nulls when any required field is empty (guard at top)', () => {
    // parts[0] empty: guard returns early, all values null
    const delta = new Parser().parse(
      '$IIBWR,,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*2E'
    ) as any
    const map = Object.fromEntries(
      delta.updates[0]!.values.map((v: any) => [v.path, v.value])
    )
    should.equal(map['navigation.courseRhumbline.bearingTrackTrue'], null)
    should.equal(map['navigation.courseRhumbline.bearingTrackMagnetic'], null)
    should.equal(map['navigation.courseRhumbline.nextPoint.distance'], null)
    should.equal(map['navigation.courseRhumbline.nextPoint.position'], null)
  })

  it('Emits exact numeric values for canonical input', () => {
    const delta = new Parser().parse(
      '$GPBWR,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*38'
    ) as any
    const map = Object.fromEntries(
      delta.updates[0]!.values.map((v: any) => [v.path, v.value])
    )
    map['navigation.courseRhumbline.bearingTrackTrue'].should.equal(
      0.9058258819918839
    )
    map['navigation.courseRhumbline.bearingTrackMagnetic'].should.equal(
      0.5515240437561374
    )
    map['navigation.courseRhumbline.nextPoint.distance'].should.equal(
      2407.6000020320143
    )
    map['navigation.courseRhumbline.nextPoint.position'].should.deep.equal({
      latitude: 49.287333333333336,
      longitude: -123.1595
    })
  })

  it('Uses km and reversed M/T ordering', () => {
    const delta = new Parser().parse(
      '$IIBWR,200321,4917.24,N,12309.57,W,119.5,M,129.5,T,22.10,K,1*25'
    ) as any
    const values = delta.updates[0]!.values
    values
      .find(
        (v: any) => v.path === 'navigation.courseRhumbline.nextPoint.distance'
      )!
      .value.should.be.closeTo(22100, 0.5)
    values
      .find(
        (v: any) => v.path === 'navigation.courseRhumbline.bearingTrackMagnetic'
      )!
      .value.should.be.closeTo(2.0856684566094437, 0.000001)
    values
      .find(
        (v: any) => v.path === 'navigation.courseRhumbline.bearingTrackTrue'
      )!
      .value.should.be.closeTo(2.2602013818487277, 0.000001)
  })
})
