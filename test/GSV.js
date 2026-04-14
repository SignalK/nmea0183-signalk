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
  '$GAGSV,2,2,07,15,39,060,33,21,63,228,39,26,30,239,40,0*44',
]

describe('GSV', () => {
  it('GPGSV converts to GPS', () => {
    const parser = new Parser()
    let r = parser.parse(testData[0])
    expect(r).to.be.null
    r = parser.parse(testData[1])
    expect(r).to.be.null
    r = parser.parse(testData[2])
    expect(r).to.not.be.null
    const pathValue = r.updates[0].values[0]
    pathValue.path.should.equal('navigation.gnss.satellitesInView')
    pathValue.value.should.have.property('gnss', 'GPS')
  })

  it('GPGSV with not repeated numOfSentences, satsInView converts', () => {
    const data = [
      '$GPGSV,3,1,10,8,13,62,35,13,50,277,39,18,18,324,33,5,53,228,38*48',
      '$GPGSV,,2,,7,43,71,39,30,73,107,38,27,13,26,34,15,14,289,37*7F',
      '$GPGSV,,3,,14,33,150,40,28,26,155,37*44',
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
      SNR: 35,
      azimuth: 1.0821041364835606,
      elevation: 0.22689280281106916,
      id: 8,
    })
  })

  it('GLGSV converts to GLONASS', () => {
    const data = [
      '$GLGSV,2,1,06,78,55,122,40,77,32,036,37,69,57,298,41,68,66,101,38,1*79',
      '$GLGSV,2,2,06,85,30,317,27,84,22,262,19,1*72',
    ]
    const parser = new Parser()
    let r = parser.parse(data[0])
    expect(r).to.be.null
    r = parser.parse(data[1])
    expect(r).to.not.be.null
    const pathValue = r.updates[0].values[0]
    pathValue.path.should.equal('navigation.gnss.satellitesInView')
    pathValue.value.gnss.should.equal('GLONASS')
    pathValue.value.count.should.equal(6)
    pathValue.value.satellites.length.should.equal(6)
    pathValue.value.satellites[0].should.eql({
      id: 78 - 64,
      elevation: 0.9599310888160619,
      azimuth: 2.1293016879192646,
      SNR: 40,
    })
  })

  it('GAGSV converts to Galileo', () => {
    const data = [
      '$GAGSV,3,1,10,04,27,094,38,05,41,265,39,15,19,332,35,36,19,221,33,7*78',
      '$GAGSV,3,2,10,06,53,100,36,09,79,122,32,21,09,017,30,34,37,277,35,7*78',
      '$GAGSV,3,3,10,31,27,125,32,23,34,065,35,7*71',
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
    pathValue.value.gnss.should.equal('GALILEO')
    pathValue.value.count.should.equal(10)
    pathValue.value.satellites.length.should.equal(10)
    pathValue.value.satellites[0].should.eql({
      id: 4,
      elevation: 0.47123889814606673,
      azimuth: 1.6406094972492695,
      SNR: 38,
    })
  })

  it('GPGSVH converts to GPS, slave antenna', () => {
    const data = [
      '$GPGSVH,3,1,10,29,62,223,40,12,33,123,42,25,63,147,41,28,48,263,43,1*21',
      '$GPGSVH,3,2,10,06,13,035,25,31,35,302,24,04,11,350,19,26,13,295,21,1*2B',
      '$GPGSVH,3,3,10,21,14,091,25,20,22,094,25,1*2C',
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
    pathValue.value.should.have.property('gnss', 'GPS')
    pathValue.value.should.have.property('antennaType', 'SLAVE')
  })
})
