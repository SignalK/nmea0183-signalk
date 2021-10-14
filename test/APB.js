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
const expect = chai.expect

chai.Should()
chai.use(require('chai-things'))

describe('APB', (done) => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C'
    )
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values
      .find((x) => x.path === 'navigation.courseRhumbline.crossTrackError')
      .value.should.be.closeTo(-185.2, 0.001)
    delta.updates[0].values
      .find((x) => x.path === 'navigation.courseRhumbline.bearingTrackMagnetic')
      .value.should.be.closeTo(0.19198621776321237, 0.000001)
    delta.updates[0].values
      .find(
        (x) =>
          x.path === 'navigation.courseRhumbline.bearingToDestinationMagnetic'
      )
      .value.should.be.closeTo(0.19198621776321237, 0.000001)
    delta.updates[0].values
      .find((x) => x.path === 'navigation.courseRhumbline.nextPoint.ID')
      .value.should.equal('DEST')
    delta.updates[0].values
      .find((x) => x.path === 'steering.autopilot.target.headingMagnetic')
      .value.should.closeTo(0.19198621776321237, 0.0001)
    expect(
      delta.updates[0].values.find(
        (x) => x.path === 'notifications.arrivalCircleEntered'
      ).value
    ).to.be.null
    expect(
      delta.updates[0].values.find(
        (x) => x.path === 'notifications.perpendicularPassed'
      ).value
    ).to.be.null
  })

  it("Doesn't choke on an empty sentence", () => {
    const delta = new Parser().parse('$GPAPB,,,,,,,,,,,,,,*44')
    should.equal(delta, null)
  })
})
