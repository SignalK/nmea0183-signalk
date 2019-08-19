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

describe('BOD', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$GPBOD,045.,T,023.,M,DEST,START*01')
    // console.log(JSON.stringify(delta, null, 2))

    delta.should.be.an('object')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.bearingTrackTrue')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.7853981635767779)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.bearingTrackMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('value', 0.40142572805035315)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.nextPoint.ID')
    delta.updates[0].values.should.contain.an.item.with.property('value', 'DEST')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseRhumbline.previousPoint.ID')
    delta.updates[0].values.should.contain.an.item.with.property('value', 'START')
  })

  it('Doesn\'t choke on an empty sentence', () => {
    const delta = new Parser().parse('$GPBOD,,,,,,*5E')
    should.equal(delta, null)
  })
})
