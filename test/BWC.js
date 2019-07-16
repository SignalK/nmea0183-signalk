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
    const delta = new Parser().parse('$GPBWC,225444,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*29')
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseGreatCircle.bearingTrackTrue')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.9058258819918839)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseGreatCircle.bearingTrackMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.5515240437561374)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseGreatCircle.nextPoint.distance')
    delta.updates[0].values.should.contain.an.item.with.property('value', 1.3)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseGreatCircle.nextPoint.position')
  })

  it('Doesn\'t choke on an empty sentence', () => {
    const delta = new Parser().parse('$GPBWC,,,,,,,,,,,,*41')
    should.equal(delta, null)
  })
})
