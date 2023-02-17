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

const seatalkHooks = require('../hooks/seatalk')
var utils = require('@signalk/nmea0183-utilities')
const chai = require('chai')

const Parser = require('../lib')

const depthData = '00,02,41,22,22'
const apparentWindAngleData = '10,01,01,10'
const apparentWindSpeedData = '11,01,01,02'
const speedThroughWaterData = '20,01,22,11'
const tripMileageData = '21,02,32,34,02'
const logData = '22,02,33,56,00'
const tripAndLogData = '25,44,65,54,43,32,02'
const averageSpeedThroughWaterData = '26,04,12,11,10,11,21'
const waterTemperatureData = '27,01,01,01'
const latitudeData = '50,22,21,01'
const longitudeData = '51,21,21,01'
const sogData = '52,01,02,00'
const cogData = '53,10,22'
const timeTag = '\\s:test,c:1438489697*29\\'
const timeData = '54,21,22,11' //using tag to force timestamp
const dateTag = '\\s:test,c:1438489697*29\\'
const dateData = '56,31,23,18' //using tag to force timestamp
const satInfoData = '57,70,94'
const headingData = '84,B6,10,00,00,00,00,00,00'
const standbyData = '84,E6,15,00,00,00,00,00,08'
const autoData = '84,56,5E,79,02,00,00,00,08'
const windData = '84,06,00,00,04,00,00,00,00'
const routeData = '84,06,00,00,08,00,00,00,00'
const rudderData = '84,06,00,00,08,00,FE,00,00'
const compassVariationData = '99,00,43'
const heading_nineCData = '9C,51,1E,00'
const empty_nineCData = '9C,,,'
const empty_eightFourData = '84,,,,,,,,'

const should = chai.Should()
chai.use(require('chai-things'))

describe('seatalk', () => {
  ;['$PSMDST,', '$PSMDST_R,', '$STALK,'].forEach((prefix) => {
    it(`${prefix} 0x00 depth converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${depthData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'environment.depth.belowTransducer'
      )
      delta.updates[0].values[0].value.should.be.closeTo(266.33424, 0.0005)
    })

    it(`${prefix} 0x10 AWA converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${apparentWindAngleData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'environment.wind.angleApparent'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        2.373647783254262,
        0.0005
      )
    })

    it(`${prefix} 0x11 AWS converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${apparentWindSpeedData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'environment.wind.speedApparent'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        0.6173334897244841,
        0.0005
      )
    })

    it(`${prefix} 0x20 STW converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${speedThroughWaterData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.speedThroughWater'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        2.6236673313290573,
        0.0005
      )
    })

    it(`${prefix} 0x21 Trip converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${tripMileageData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.trip'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        2674917.68225763,
        0.0005
      )
    })

    it(`${prefix} 0x22 Total log converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${logData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.log'
      )
      delta.updates[0].values[0].value.should.be.closeTo(4086808.4, 0.5)
    })

    it(`${prefix} 0x25 trip and log converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${tripAndLogData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.trip'
      )
      delta.updates[0].values[0].value.should.be.closeTo(2665750.28, 0.5)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.log'
      )
      delta.updates[0].values[1].value.should.be.closeTo(7035562.8, 0.5)
    })

    it(`${prefix} 0x26 STW converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${averageSpeedThroughWaterData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.averageSpeedThroughWater'
      )
      delta.updates[0].values[0].value.should.be.closeTo(22.47, 0.5)
    })

    it(`${prefix} 0x27 Water temperature converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${waterTemperatureData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'environment.water.temperature'
      )
      delta.updates[0].values[0].value.should.be.closeTo(288.9, 0.5)
    })

    const parser = new Parser()

    it(`${prefix} 0x50 Latitude and 0x51 Longitude converted`, () => {
      var fullSentence = utils.appendChecksum(`${prefix}${latitudeData}`)
      var delta = parser.parse(fullSentence)

      fullSentence = utils.appendChecksum(`${prefix}${longitudeData}`)
      delta = parser.parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.position'
      )
      delta.updates[0].values[0].value['latitude'].should.be.closeTo(33, 0.5)
      delta.updates[0].values[0].value['longitude'].should.be.closeTo(-33, 0.5)
    })

    it(`${prefix} 0x52 SOG converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${sogData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.speedOverGround'
      )
      delta.updates[0].values[0].value.should.be.closeTo(0.103, 0.005)
    })

    it(`${prefix} 0x53 COG converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${cogData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.courseOverGroundMagnetic'
      )
      delta.updates[0].values[0].value.should.be.closeTo(2.7576, 0.005)
    })

    it(`${prefix} 0x54 time disabled`, () => {
      const fullSentence =
        timeTag + utils.appendChecksum(`${prefix}${timeData}`)
      const delta = parser.parse(fullSentence)
    })

    it(`${prefix} 0x56 date disabled`, () => {
      const fullSentence =
        dateTag + utils.appendChecksum(`${prefix}${dateData}`)
      const delta = parser.parse(fullSentence)

      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.datetime'
      )
      delta.updates[0].values[0].value.should.equal('2024-04-04T17:08:34.000Z')
    })

    it(`${prefix} 0x57 satelite info converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${satInfoData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.gnss.satellites'
      )
      delta.updates[0].values[0].value.should.equal(7)
    })

    it(`${prefix} 0x84 heading converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${headingData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.headingMagnetic'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        5.305800926062761,
        0.0005
      )
    })

    it(`${prefix} 0x84 ap mode: standby converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${standbyData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.autopilot.state'
      )
      delta.updates[0].values[1].value.should.equal('standby')
    })

    it(`${prefix} 0x84 ap mode: auto converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${autoData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.autopilot.target.headingMagnetic'
      )
      delta.updates[0].values[1].value.should.be.closeTo(
        2.626720524251466,
        0.0005
      )

      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.autopilot.state'
      )
      delta.updates[0].values[2].value.should.equal('auto')
    })

    it(`${prefix} 0x84 ap mode: wind converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${windData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.autopilot.state'
      )
      delta.updates[0].values[0].value.should.equal('wind')
    })

    it(`${prefix} 0x84 ap mode: route converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${routeData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.autopilot.state'
      )
      delta.updates[0].values[0].value.should.equal('route')
    })

    it(`${prefix} 0x84 rudder angle converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${rudderData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'steering.rudderAngle'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        -0.03490658503988659,
        0.0005
      )
    })

    it(`${prefix} 0x99 compass variation converted`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${compassVariationData}`
      )
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.magneticVariation'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        1.0646508439596323,
        0.0005
      )
    })

    it(`${prefix} 0x9C ap target heading  converted`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${heading_nineCData}`)
      const delta = new Parser().parse(fullSentence)
      delta.updates[0].values.should.contain.an.item.with.property(
        'path',
        'navigation.headingMagnetic'
      )
      delta.updates[0].values[0].value.should.be.closeTo(
        2.6529004630313806,
        0.0005
      )
    })

    it(`${prefix} Doesn\'t choke on empty 0x9C sentences`, () => {
      const fullSentence = utils.appendChecksum(`${prefix}${empty_nineCData}`)
      const delta = new Parser().parse(fullSentence)
      should.equal(delta, null)
    })

    it(`${prefix} Doesn\'t choke on empty 0x84 sentences`, () => {
      const fullSentence = utils.appendChecksum(
        `${prefix}${empty_eightFourData}`
      )
      const delta = new Parser().parse(fullSentence)
      should.equal(delta, null)
    })
  })
})
