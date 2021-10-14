/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
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

const utils = require('@signalk/nmea0183-utilities')

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
 *   6.    Absolute humidity, percent <-- absolute is usually density, but NMEA probably using less common mass water per mass atmosphere formulation
 *   7.    Dew point, deg Celsius
 *   8.    Wind direction, degress True
 *   9.    Wind direction, degress Magnetic
 *  10.    Wind speed, knots
 *  11.    Wind speed, m/s
 *  12.    Checksum
 */

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  const values = []

  // make SI units override any non-SI units
  if (parts[0] !== '') {
    values.push({
      path: 'environment.outside.pressure',
      value: 3386.3886666667 * utils.float(parts[0]), // converting inHg -> Pa (SI units)
    })
  }
  if (parts[2] !== '') {
    values.push({
      path: 'environment.outside.pressure',
      value: utils.float(parts[2]) * 100000.0, // converting from bars to Pa (SI units)
    })
  }
  if (parts[4] !== '') {
    values.push({
      path: 'environment.outside.temperature',
      value: utils.transform(utils.float(parts[4]), 'c', 'k'), // transform units Celsius to Kelvin (stick to SI units)
    })
  }
  if (parts[6] !== '') {
    values.push({
      path: 'environment.water.temperature',
      value: utils.transform(utils.float(parts[6]), 'c', 'k'), // transform units Celsius to Kelvin (stick to SI units)
    })
  }
  if (parts[8] !== '') {
    values.push({
      path: 'environment.outside.humidity',
      value: utils.float(parts[8]) / 100.0, // converting from precentage to fraction
    })
  }
  if (parts[9] !== '') {
    values.push({
      path: 'environment.outside.humidityAbsolute',
      value: utils.float(parts[9]) / 100.0, // NMEA docs suggest this is a fraction/percentage, so probably they mean mass water per mass atmosphere formulation
    })
  }
  if (parts[10] !== '') {
    values.push({
      path: 'environment.outside.dewPointTemperature',
      value: utils.transform(utils.float(parts[10]), 'c', 'k'),
    })
  }
  if (parts[12] !== '') {
    values.push({
      path: 'environment.wind.directionTrue',
      value: utils.transform(utils.float(parts[12]), 'deg', 'rad'),
    })
  }
  if (parts[14] !== '') {
    values.push({
      path: 'environment.wind.directionMagnetic',
      value: utils.transform(utils.float(parts[14]), 'deg', 'rad'),
    })
  }
  if (parts[16] !== '') {
    values.push({
      path: 'environment.wind.speedOverGround',
      value: utils.transform(utils.float(parts[16]), 'knots', 'ms'),
    })
  }
  if (parts[18] !== '') {
    values.push({
      path: 'environment.wind.speedOverGround',
      value: utils.float(parts[18]),
    })
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: values,
      },
    ],
  }

  return delta
}
