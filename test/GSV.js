/**
 * Copyright 2021 Signal K and contributors.
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
const { expect } = require('chai')
const should = chai.Should()

const testData = [
  '$GPGSV,3,1,09,07,16,321,37,08,29,281,33,10,29,143,35,16,75,216,35,0*6E',
  '$GPGSV,3,2,09,18,38,057,35,20,44,105,40,21,81,117,33,26,43,164,25,0*63',
  '$GPGSV,3,3,09,27,62,289,41,0*5B',
  '$GLGSV,3,1,10,65,14,112,18,71,15,018,11,72,25,069,31,77,10,181,30,0*79',
  '$GLGSV,3,2,10,78,52,221,38,79,44,310,28,80,00,342,,81,35,261,40,0*7E',
  '$GLGSV,3,3,10,87,41,052,31,88,75,350,33,0*73',
  '$GAGSV,2,1,07,01,37,308,33,03,09,074,35,05,07,025,,13,85,237,31,0*7F',
  '$GAGSV,2,2,07,15,39,060,33,21,63,228,39,26,30,239,40,0*44'
]




describe('GSV', () => {

  it('GPGSV converts', () => {
    const parser = new Parser()
    let r = parser.parse(testData[0])
    expect(r).to.be.null
    r = parser.parse(testData[1])
    expect(r).to.be.null
    r = parser.parse(testData[2])
    expect(r).to.not.be.null
    const pathValue = r.updates[0].values[0]
    pathValue.path.should.equal('navigation.gnss.satellitesInView')
  })

  it('GPGSV with not repeated numOfSentences, satsInView converts', () => {
    const data = [
      '$GPGSV,3,1,10,8,13,62,35,13,50,277,39,18,18,324,33,5,53,228,38*48',
      '$GPGSV,,2,,7,43,71,39,30,73,107,38,27,13,26,34,15,14,289,37*7F',
      '$GPGSV,,3,,14,33,150,40,28,26,155,37*44'
    ]
    const parser = new Parser()
    let r = parser.parse(data[0])
    expect(r).to.be.null
    r = parser.parse(data[1])
    expect(r).to.be.null
    r = parser.parse(data[2])
    expect(r).to.not.be.null
    const pathValue = r.updates[0].values[0]
    pathValue.path.should.equal('navigation.gnss.satellitesInView')
    pathValue.value.count.should.equal(10)
    pathValue.value.satellites[0].should.eql({
      "SNR": 35,
      "azimuth": 1.0821041364835606,
      "elevation": 0.22689280281106916,
      "id": 8
    })
  })

})
