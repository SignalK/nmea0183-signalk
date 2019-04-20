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
  *   6.    Absolute humidity, percent <-- absolute shoud not be a fraction (something wrong with NMEA definition?! usually this is g/m3, in SI units)
  *   7.    Dew point, deg Celsius
  *   8.    Wind direction, degress True
  *   9.    Wind direction, degress Magnetic
  *  10.    Wind speed, knots
  *  11.    Wind speed, m/s
  *  12.    Checksum
  */

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  // make SI units override any non-SI units
  let pressure = null
  if( parts[0] != '' ) pressure = 33.863886666667 * utils.float(parts[0]) // converting inHg -> hPa (SI units)
  if( parts[2] != '' ) pressure = utils.float(parts[2])*1000.0  // converting from bars to hPa (SI units)

  let temperature = null
  if( parts[4] != '' ) temperature = utils.transform(utils.float(parts[4]), 'c', 'k') // transform units Celsius to Kelvin (stick to SI units)

  let waterTemperature = null
  if( parts[6] != '' ) waterTemperature = utils.transform(utils.float(parts[6]), 'c', 'k')

  let humidityRelative = null
  if( parts[8] != '' ) humidityRelative = utils.float(parts[8])/100.0 // converting from precentage to fraction

  let humidityAbsolute = null
  if( parts[9] != '' ) humidityAbsolute = utils.float(parts[9])/100.0 // NMEA docs suggest this is a fraction/percentage, so probably they mean mass water per mass atmosphere formulation

  let dewPoint = null
  if( parts[10] != '') dewPoint = utils.transform(utils.float(parts[10]), 'c', 'k')

  let windDirectionTrue = null
  if( parts[12] != '') windDirectionTrue = utils.transform(utils.float(parts[12]), 'deg', 'rad')

  let windDirectionMagnetic = null
  if( parts[14] != '') windDirectionMagnetic = utils.transform(utils.float(parts[14]), 'deg', 'rad')

  let windSpeed = null
  if( parts[16] != '') windSpeed = utils.transform(utils.float(parts[16]), 'knots', 'ms')
  if( parts[18] != '') windSpeed = utils.float(parts[18])

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: []
      }
    ],
  }

  if( pressure != null ) delta.updates[0].values.push( { path: 'environment.outside.pressure',
                                                         value: pressure } );
  if( temperature != null ) delta.updates[0].values.push( { path: 'environment.outside.temperature',
                                                            value: temperature } );
  if( waterTemperature != null ) delta.updates[0].values.push( { path: 'environment.water.temperature',
                                                                 value: waterTemperature } );
  if( humidityRelative != null ) delta.updates[0].values.push( { path: 'environment.outside.humidity',
                                                                value: humidityRelative } );
  if( humidityAbsolute != null ) delta.updates[0].values.push( { path: 'environment.outside.humidityAbsolute',
                                                                value: humidityAbsolute } );
  if( dewPoint != null ) delta.updates[0].values.push( { path: 'environment.outside.dewPointTemperature',
                                                                value: dewPoint } );
  if( windDirectionTrue != null ) delta.updates[0].values.push( { path: 'environment.wind.directionTrue',
                                                                 value: windDirectionTrue } );
  if( windDirectionMagnetic != null ) delta.updates[0].values.push( { path: 'environment.wind.directionMagnetic',
                                                                     value: windDirectionMagnetic } );
  if( windSpeed != null ) delta.updates[0].values.push( { path: 'environment.wind.speedOverGround',
                                                         value: windSpeed } );
  return delta
}
