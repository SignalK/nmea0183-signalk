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

 /*
  * MDA - Meteorological Composite
  *
  *        1     2     3     4     5   6   7     8     9     10    11    12
  *        |     |     |     |     |   |   |     |     |     |     |     |
  * $--MDA,x.x,I,x.x,B,x.x,C,x.x,C,x.x,x.x,x.x,C,x.x,T,x.x,M,x.x,N,x.x,M*hh<CR><LF>
  * Field Number:
  *   1.    Barometric pressure, inches of mercury
  *   2.    Barometric pressure, bars
  *   3.    Air temperature, deg Celsius
  *   4.    Water temperature, deg Celsius
  *   5.    Relative humidity, percent
  *   6.    Absolute humidity, percent <-- absolute shoud not be a fraction (something wrong with NMEA definition?! usually this is g/m3, in SI units)
  *   7.    Dew point, deg Celsius
  *   8.    Wind direction, degress True
  *   9.    Wind direction, degress Magnetic
  *  10.    Wind speed, knots
  *  11.    Wind speed, m/s
  *  12.    Checksum
  */

'use strict'

const Parser = require('../lib')
const chai = require('chai')

chai.Should()
chai.use(require('chai-things'))

describe('MDA', () => {
  it('check parsing with barometric pressure and wind speed in knots', () => {
    const delta = new Parser().parse("$WIMDA,,I,+0.985,B,+03.1,C,+5.6,C,40.0,3.0,+3.4,C,90.0,T,85.0,M,10.0,N,,M*1A")

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.pressure')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.temperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.water.temperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.humidity')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.humidityAbsolute')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.dewPointTemperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.directionTrue')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.directionMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedOverGround')

    delta.updates[0].values.find(x => x.path === 'environment.outside.pressure').should.contain.property('value', 985)
    delta.updates[0].values.find(x => x.path === 'environment.outside.temperature').should.contain.property('value', 276.25)
    delta.updates[0].values.find(x => x.path === 'environment.water.temperature').should.contain.property('value', 278.75)
    delta.updates[0].values.find(x => x.path === 'environment.outside.humidity').should.contain.property('value', 0.4)
    delta.updates[0].values.find(x => x.path === 'environment.outside.humidityAbsolute').should.contain.property('value', 0.03)
    delta.updates[0].values.find(x => x.path === 'environment.outside.dewPointTemperature').value.should.be.closeTo(276.55, 0.01)
    delta.updates[0].values.find(x => x.path === 'environment.wind.directionTrue').value.should.be.closeTo(1.5707, 0.0001)
    delta.updates[0].values.find(x => x.path === 'environment.wind.directionMagnetic').value.should.be.closeTo(1.4835, 0.0001)
    delta.updates[0].values.find(x => x.path === 'environment.wind.speedOverGround').value.should.be.closeTo(5.14444, 0.0001)
  })

  it('check parsing with inHg pressure and wind speed in m/s', () => {
    const delta = new Parser().parse("$WIMDA,29.92,I,,B,+03.1,C,+5.6,C,40.0,3.0,+3.4,C,90.0,T,85.0,M,,N,5.0,M*01")

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.pressure')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.temperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.water.temperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.humidity')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.humidityAbsolute')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.dewPointTemperature')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.directionTrue')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.directionMagnetic')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedOverGround')

    delta.updates[0].values.find(x => x.path === 'environment.outside.pressure').value.should.be.closeTo(1013.2075, 0.0001)
    delta.updates[0].values.find(x => x.path === 'environment.outside.temperature').should.contain.property('value', 276.25)
    delta.updates[0].values.find(x => x.path === 'environment.water.temperature').should.contain.property('value', 278.75)
    delta.updates[0].values.find(x => x.path === 'environment.outside.humidity').should.contain.property('value', 0.4)
    delta.updates[0].values.find(x => x.path === 'environment.outside.humidityAbsolute').should.contain.property('value', 0.03)
    delta.updates[0].values.find(x => x.path === 'environment.outside.dewPointTemperature').value.should.be.closeTo(276.55, 0.01)
    delta.updates[0].values.find(x => x.path === 'environment.wind.directionTrue').value.should.be.closeTo(1.5707, 0.0001)
    delta.updates[0].values.find(x => x.path === 'environment.wind.directionMagnetic').value.should.be.closeTo(1.4835, 0.0001)
    delta.updates[0].values.find(x => x.path === 'environment.wind.speedOverGround').value.should.be.closeTo(5.0, 0.0001)
  })

  it('check for no hickup on empty message', () => {
    const delta = new Parser().parse("$WIMDA,,I,,B,,C,,C,,,,C,,T,,M,,N,,M*04")

    delta.updates[0].values.should.be.empty
  })

})
