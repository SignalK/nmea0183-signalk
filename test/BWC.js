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
chai.use(require('chai-things'))

describe('BWC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*29'
    )
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values.should.deep.equal([
      {
        path: 'navigation.courseGreatCircle.nextPoint.position',
        value: {
          latitude: 49.287333333333336,
          longitude: -123.1595,
        },
      },
      {
        path: 'navigation.courseGreatCircle.nextPoint.distance',
        value: 2407.6000020320143,
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackTrue',
        value: 0.9058258819918839,
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
        value: 0.5515240437561374,
      },
    ])

    // delta.updates[0].values.find(x => x.path === 'navigation.courseRhumbline.bearingToDestinationMagnetic').value.should.be.closeTo(0.19198621776321237, 0.000001)
  })

  it('Converts also without next position coordinates', () => {
    const delta = new Parser().parse(
      '$IIBWC,200321,,,,,119.5,T,129.5,M,22.10,N,1*1E'
    )

    delta.should.be.an('object')
    delta.updates[0].values.should.deep.equal([
      {
        path: 'navigation.courseGreatCircle.nextPoint.distance',
        value: 40929.20003454424,
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackTrue',
        value: 2.0856684566094437,
      },
      {
        path: 'navigation.courseGreatCircle.bearingTrackMagnetic',
        value: 2.2602013818487277,
      },
    ])
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPBWC,,,,,,,,,,,,*41')
    should.equal(delta, undefined)
  })
})
