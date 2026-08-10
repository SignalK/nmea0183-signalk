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

import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'

chai.Should()
chai.use(chaiHasItem as any)

describe('MDA', () => {
  it('check parsing with barometric pressure and wind speed in knots', () => {
    const delta = new Parser().parse(
      '$WIMDA,,I,+0.985,B,+03.1,C,+5.6,C,40.0,3.0,+3.4,C,90.0,T,85.0,M,10.0,N,,M*1A'
    ) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.pressure'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.temperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.water.temperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.humidity'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.humidityAbsolute'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.dewPointTemperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.directionTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.directionMagnetic'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.speedOverGround'
    )

    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.pressure'
    ).should.contain.property('value', 98500)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.temperature'
    ).should.contain.property('value', 276.25)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.water.temperature'
    ).should.contain.property('value', 278.75)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.humidity'
    ).should.contain.property('value', 0.4)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.humidityAbsolute'
    ).should.contain.property('value', 0.03)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.dewPointTemperature'
    )!.value.should.be.closeTo(276.55, 0.01)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.directionTrue'
    )!.value.should.be.closeTo(1.5707, 0.0001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.directionMagnetic'
    )!.value.should.be.closeTo(1.4835, 0.0001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.speedOverGround'
    )!.value.should.be.closeTo(5.14444, 0.0001)
  })

  it('check parsing with inHg pressure and wind speed in m/s', () => {
    const delta = new Parser().parse(
      '$WIMDA,29.92,I,,B,+03.1,C,+5.6,C,40.0,3.0,+3.4,C,90.0,T,85.0,M,,N,5.0,M*01'
    ) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.pressure'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.temperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.water.temperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.humidity'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.humidityAbsolute'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.outside.dewPointTemperature'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.directionTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.directionMagnetic'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.speedOverGround'
    )

    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.pressure'
    )!.value.should.be.closeTo(101320.75, 0.005)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.temperature'
    ).should.contain.property('value', 276.25)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.water.temperature'
    ).should.contain.property('value', 278.75)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.humidity'
    ).should.contain.property('value', 0.4)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.humidityAbsolute'
    ).should.contain.property('value', 0.03)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.outside.dewPointTemperature'
    )!.value.should.be.closeTo(276.55, 0.01)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.directionTrue'
    )!.value.should.be.closeTo(1.5707, 0.0001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.directionMagnetic'
    )!.value.should.be.closeTo(1.4835, 0.0001)
    delta.updates[0]!.values.find(
      (x: any) => x.path === 'environment.wind.speedOverGround'
    )!.value.should.be.closeTo(5.0, 0.0001)
  })

  it('returns null on an entirely empty MDA', () => {
    // Previously emitted a delta with an empty values array; returning
    // null is consistent with every other hook's "no usable data"
    // behaviour and keeps downstream consumers from having to skip
    // empty-delta events.
    const delta = new Parser().parse(
      '$WIMDA,,I,,B,,C,,C,,,,C,,T,,M,,N,,M*04'
    ) as any
    ;(delta === null).should.equal(true)
  })
})
