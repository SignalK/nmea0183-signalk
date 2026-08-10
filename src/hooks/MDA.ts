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

import * as utils from '@signalk/nmea0183-utilities'
import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../types'

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

// inHg -> Pa conversion factor: 1 inHg = 3386.3886666667 Pa.
const INHG_TO_PA = 3386.3886666667

const MDA: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input
  const values: DeltaValue[] = []

  const inHg = utils.floatOrNull(parts[0]!)
  if (inHg !== null) {
    values.push({
      path: 'environment.outside.pressure',
      value: inHg * INHG_TO_PA
    })
  }
  // SI (bars) overrides non-SI (inches of mercury) when both are present.
  const bars = utils.floatOrNull(parts[2]!)
  if (bars !== null) {
    values.push({
      path: 'environment.outside.pressure',
      value: bars * 100000.0
    })
  }

  const airTemp = utils.transformOrNull(parts[4]!, 'c', 'k')
  if (airTemp !== null) {
    values.push({ path: 'environment.outside.temperature', value: airTemp })
  }

  const waterTemp = utils.transformOrNull(parts[6]!, 'c', 'k')
  if (waterTemp !== null) {
    values.push({ path: 'environment.water.temperature', value: waterTemp })
  }

  const humidity = utils.floatOrNull(parts[8]!)
  if (humidity !== null) {
    values.push({
      path: 'environment.outside.humidity',
      value: humidity / 100.0
    })
  }

  const humidityAbs = utils.floatOrNull(parts[9]!)
  if (humidityAbs !== null) {
    values.push({
      path: 'environment.outside.humidityAbsolute',
      value: humidityAbs / 100.0
    })
  }

  const dewPoint = utils.transformOrNull(parts[10]!, 'c', 'k')
  if (dewPoint !== null) {
    values.push({
      path: 'environment.outside.dewPointTemperature',
      value: dewPoint
    })
  }

  const windDirTrue = utils.transformOrNull(parts[12]!, 'deg', 'rad')
  if (windDirTrue !== null) {
    values.push({
      path: 'environment.wind.directionTrue',
      value: windDirTrue
    })
  }

  const windDirMag = utils.transformOrNull(parts[14]!, 'deg', 'rad')
  if (windDirMag !== null) {
    values.push({
      path: 'environment.wind.directionMagnetic',
      value: windDirMag
    })
  }

  const windKnots = utils.transformOrNull(parts[16]!, 'knots', 'ms')
  if (windKnots !== null) {
    values.push({
      path: 'environment.wind.speedOverGround',
      value: windKnots
    })
  }

  // m/s overrides knots when both are present (same override pattern as bars vs inHg).
  const windMs = utils.floatOrNull(parts[18]!)
  if (windMs !== null) {
    values.push({ path: 'environment.wind.speedOverGround', value: windMs })
  }

  if (values.length === 0) {
    return null
  }

  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values
      }
    ]
  }
}

export default MDA
