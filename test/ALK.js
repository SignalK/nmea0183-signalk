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

const depth = '$STALK,00,02,41,22,22*6A'
const apparentWindAngle = '$STALK,10,01,01,10*41'
const apparentWindSpeed = '$STALK,11,01,01,02*43'
const speedThroughWater = '$STALK,20,01,22,11*42'
const tripMileage = '$STALK,21,02,32,34,02*68'
const log = '$STALK,22,02,33,56,00*6C'
const tripAndLog = '$STALK,25,44,65,54,43,32,02*6C'
const averageSpeedThroughWater = '$STALK,26,04,12,11,10,11,21*6C'
const waterTemperature = '$STALK,27,01,01,01*45'
const latitude = '$STALK,50,22,21,01*46'
const longitude = '$STALK,51,21,21,01*44'
const sog = '$STALK,52,01,02,00*45'
const cog = '$STALK,53,10,22*6A'
const time = '\\s:test,c:1438489697*29\\$STALK,54,21,22,11*43' //using tag to force timestamp
const date ='\\s:test,c:1438489697*29\\$STALK,56,31,23,18*48' //using tag to force timestamp
const satInfo = '$STALK,57,70,94*65'
const heading = '$STALK,84,B6,10,00,00,00,00,00,00*14'
const standby = '$STALK,84,E6,15,00,00,00,00,00,08*1E'
const auto = '$STALK,84,56,5E,79,02,00,00,00,08*16'
const wind = '$STALK,84,06,00,00,04,00,00,00,00*63'
const route = '$STALK,84,06,00,00,08,00,00,00,00*6F'
const rudder = '$STALK,84,06,00,00,08,00,FE,00,00*6C'
const compassVariation = '$STALK,99,00,43*6A'
const heading_nineC = '$STALK,9C,51,1E,00*4B'

const should = chai.Should()
chai.use(require('chai-things'))

describe('ALK', () => {

  it('0x00 depth converted', () => {
    const delta = new Parser().parse(depth)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.depth.belowTransducer')
    delta.updates[0].values[0].value.should.be.closeTo(266.33424, 0.0005)
  })

  it('0x10 AWA converted', () => {
    const delta = new Parser().parse(apparentWindAngle)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
    delta.updates[0].values[0].value.should.be.closeTo(2.373647783254262, 0.0005)
  })

  it('0x11 AWS converted', () => {
    const delta = new Parser().parse(apparentWindSpeed)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedApparent')
    delta.updates[0].values[0].value.should.be.closeTo(0.6173334897244841, 0.0005)
  })

  it('0x20 STW converted', () => {
    const delta = new Parser().parse(speedThroughWater)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedThroughWater')
    delta.updates[0].values[0].value.should.be.closeTo(2.6236673313290573, 0.0005)
  })

  it('0x21 Trip converted', () => {
    const delta = new Parser().parse(tripMileage)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.trip')
    delta.updates[0].values[0].value.should.be.closeTo(2674917.68225763, 0.0005)
  })

  it('0x22 Total log converted', () => {
    const delta = new Parser().parse(log)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.log')
    delta.updates[0].values[0].value.should.be.closeTo(4086808.4, 0.5)
  })

  it('0x25 trip and log converted', () => {
    const delta = new Parser().parse(tripAndLog)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.trip')
    delta.updates[0].values[0].value.should.be.closeTo(2665750.28, 0.5)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.log')
    delta.updates[0].values[1].value.should.be.closeTo(7035562.8, 0.5)
  })

  it('0x26 STW converted', () => {
    const delta = new Parser().parse(averageSpeedThroughWater)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.averageSpeedThroughWater')
    delta.updates[0].values[0].value.should.be.closeTo(22.47, 0.5)
  })

  it('0x27 Water temperature converted', () => {
    const delta = new Parser().parse(waterTemperature)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.water.temperature')
    delta.updates[0].values[0].value.should.be.closeTo(288.9, 0.5)
  })

  it('0x50 Latitude converted', () => {
    const delta = new Parser().parse(latitude)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position.latitude')
    delta.updates[0].values[0].value.should.be.closeTo(33, 0.5)
  })

  it('0x51 Longitude converted', () => {
    const delta = new Parser().parse(longitude)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position.longitude')
    delta.updates[0].values[0].value.should.be.closeTo(-33, 0.5)
  })

  it('0x52 SOG converted', () => {
    const delta = new Parser().parse(sog)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedOverGround')
    delta.updates[0].values[0].value.should.be.closeTo(0.103, 0.005)
  })

  it('0x53 COG converted', () => {
    const delta = new Parser().parse(cog)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseOverGroundMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(2.7576, 0.005)
  })

  it('0x54 time disabled', () => {
    should.Throw(() => {
      new Parser().parse(time)
      },
      /Seatalk 0x54 disabled due to incomplete datetime structure/
    )
  })

  it('0x56 time disabled', () => {
    should.Throw(() => {
      new Parser().parse(date)
      },
      /Seatalk 0x56 disabled due to incomplete datetime structure/
    )
  })

  it('0x57 satelite info converted', () => {
    const delta = new Parser().parse(satInfo)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.gnss.satellites')
    delta.updates[0].values[0].value.should.equal(7)
  })

  it('0x84 heading converted', () => {
    const delta = new Parser().parse(heading)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(5.305800926062761, 0.0005)
  })

  it('0x84 ap mode: standby converted', () => {
    const delta = new Parser().parse(standby)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[1].value.should.equal('standby')
  })

  it('0x84 ap mode: auto converted', () => {
    const delta = new Parser().parse(auto)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.target.headingMagnetic')
    delta.updates[0].values[1].value.should.be.closeTo(2.626720524251466, 0.0005)

    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[2].value.should.equal('auto')
  })

  it('0x84 ap mode: wind converted', () => {
    const delta = new Parser().parse(wind)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[0].value.should.equal('wind')
  })

  it('0x84 ap mode: route converted', () => {
    const delta = new Parser().parse(route)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.autopilot.state')
    delta.updates[0].values[0].value.should.equal('route')
  })

  it('0x84 rudder angle converted', () => {
    const delta = new Parser().parse(rudder)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'steering.rudderAngle')
    delta.updates[0].values[0].value.should.be.closeTo(-0.03490658503988659, 0.0005)
  })

  it('0x99 compass variation converted', () => {
    const delta = new Parser().parse(compassVariation)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariation')
    delta.updates[0].values[0].value.should.be.closeTo(1.0646508439596323, 0.0005)
  })

  it('0x9C ap target heading  converted', () => {
    const delta = new Parser().parse(heading_nineC)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(2.6529004630313806, 0.0005)
  })

  it('Doesn\'t choke on empty 0x9C sentences', () => {
    const delta = new Parser().parse('$STALK,9C,,,*3B')
    should.equal(delta, null)
  })

  it('Doesn\'t choke on empty 0x84 sentences', () => {
    const delta = new Parser().parse('$STALK,84,,,,,,,,*61')
    should.equal(delta, null)
  })
})
