/**
 * Copyright 2019 Signal K <info@signalk.org> and contributors.
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

const Parser = require('../lib')
const should = require('chai').Should()
const toFull = require('./toFull')

describe('PBVE', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$PBVE,DGOIADNNACAEACAAABBLAAEBAACMCFAAEPAIKI*37')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.0.oilPressure')
    delta.updates[0].values[0].value.should.equal(37)
    toFull(delta).should.be.validSignalK
  })
  //currently only produce code D is supported so test that all others do not process
  it('Will not convert if productCode not D', () => {
    should.equal(new Parser().parse('$PBVE,FGLABCGJAAAHADEE*21'),undefined)
  })
})
