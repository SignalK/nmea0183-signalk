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

describe('APB', done => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C')
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.crossTrackError')
    delta.updates[0].values.should.contain.an.item.with.property('value', -0.1)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.bearingTrackMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.19198621776321237)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.bearingOriginToDestinationMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.19198621776321237)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.bearingToDestinationMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.19198621776321237)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.nextPoint.ID')
    delta.updates[0].values.should.contain.an.item.with.property('value', 'DEST')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.target.headingMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.19198621776321237)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.arrivalCircleEntered')
    delta.updates[0].values.should.contain.an.item.with.property('value', null)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.perpendicularPassed')
    delta.updates[0].values.should.contain.an.item.with.property('value', null)
  })

  it('Doesn\'t choke on an empty sentence', () => {
    const delta = new Parser().parse('$GPAPB,,,,,,,,,,,,,,*44')
    should.equal(delta, null)
  })
})
