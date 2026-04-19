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

describe('BWC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*29'
    ) as any
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0]!.values.should.deep.equal([
      {
        path: 'navigation.courseGreatCircle.nextPoint.position',
        value: {
          latitude: 49.287333333333336,
          longitude: -123.1595
        }
      },
      {
        path: 'navigation.courseGreatCircle.nextPoint.distance',
        value: 2407.6000020320143
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackTrue',
        value: 0.9058258819918839
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
        value: 0.5515240437561374
      }
    ])

    // delta.updates[0]!.values.find(x => x.path === 'navigation.courseRhumbline.bearingToDestinationMagnetic')!.value.should.be.closeTo(0.19198621776321237, 0.000001)
  })

  it('Converts also without next position coordinates', () => {
    const delta = new Parser().parse(
      '$IIBWC,200321,,,,,119.5,T,129.5,M,22.10,N,1*1E'
    ) as any

    delta.should.be.an('object')
    delta.updates[0]!.values.should.deep.equal([
      {
        path: 'navigation.courseGreatCircle.nextPoint.position',
        value: null
      },
      {
        path: 'navigation.courseGreatCircle.nextPoint.distance',
        value: 40929.20003454424
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackTrue',
        value: 2.0856684566094437
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
        value: 2.2602013818487277
      }
    ])
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPBWC,,,,,,,,,,,,*41') as any

    delta.updates[0]!.values.should.deep.equal([
      {
        path: 'navigation.courseGreatCircle.nextPoint.position',
        value: null
      }
    ])
  })

  it('Omits timestamp when parts[0] is empty', () => {
    const delta = new Parser().parse(
      '$GPBWC,,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*28'
    ) as any
    should.equal(delta.updates[0]!.timestamp, undefined)
    delta.updates[0]!.values.map((v: any) => v.path).should.include(
      'navigation.courseGreatCircle.nextPoint.position'
    )
  })

  // Each individual coordinate field going empty must collapse position to
  // null; locks the AND-chain at the top.
  ;[
    [
      'latitude value empty',
      '$GPBWC,225444,,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*0A'
    ],
    [
      'latitude hemisphere empty',
      '$GPBWC,225444,4917.24,,12309.57,W,051.9,T,031.6,M,001.3,N,004*67'
    ],
    [
      'longitude value empty',
      '$GPBWC,225444,4917.24,N,,W,051.9,T,031.6,M,001.3,N,004*3C'
    ],
    [
      'longitude hemisphere empty',
      '$GPBWC,225444,4917.24,N,12309.57,,051.9,T,031.6,M,001.3,N,004*7E'
    ]
  ].forEach(([label, sentence]: any) => {
    it(`Emits null position when ${label}`, () => {
      const delta = new Parser().parse(sentence) as any
      should.equal(
        delta.updates[0]!.values.find(
          (v: any) =>
            v.path === 'navigation.courseGreatCircle.nextPoint.position'
        ).value,
        null
      )
    })
  })

  it('Skips bearingTrackTrue when parts[6] is not "T"', () => {
    // parts[6]='', so no True bearing emitted
    const delta = new Parser().parse(
      '$GPBWC,225444,4917.24,N,12309.57,W,051.9,,031.6,M,001.3,N,004*7D'
    ) as any
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseGreatCircle.bearingTrackTrue')
    paths.should.include('navigation.courseGreatCircle.bearingTrackMagnetic')
  })

  it('Skips bearingTrackMagnetic when parts[8] is not "M"', () => {
    const delta = new Parser().parse(
      '$GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,,001.3,N,004*64'
    ) as any
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include(
      'navigation.courseGreatCircle.bearingTrackMagnetic'
    )
    paths.should.include('navigation.courseGreatCircle.bearingTrackTrue')
  })

  it('Skips distance when parts[9] or parts[10] is empty', () => {
    const delta = new Parser().parse(
      '$GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,,N,004*05'
    ) as any
    const paths = delta.updates[0]!.values.map((v: any) => v.path)
    paths.should.not.include('navigation.courseGreatCircle.nextPoint.distance')
  })

  it('Uses km when distance unit is K', () => {
    const delta = new Parser().parse(
      '$IIBWC,200321,4917.24,N,12309.57,W,119.5,T,129.5,M,22.10,K,1*34'
    ) as any
    const distance = delta.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.courseGreatCircle.nextPoint.distance'
    ).value
    distance.should.be.closeTo(22100, 0.5)
  })
})
