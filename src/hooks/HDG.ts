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
import type { Delta, HookFn, ParserInput, ParserSession } from '../types'
/*
*******  0 1   2 3   4
*******  | |   | |   |
$--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>
Field Number:
0 Magnetic Sensor heading in degrees
1 Magnetic Deviation, degrees
2 Magnetic Deviation direction, E = Easterly, W = Westerly
3 Magnetic Variation degrees
4 Magnetic Variation direction, E = Easterly, W = Westerly
*/

// Deviation and variation are both signed scalars — magnitude field +
// direction letter (E = positive, W = negative). The `*OrNull` helpers
// short-circuit missing fields to null so an empty deviation / variation
// doesn't silently become 0° of correction (which would publish a wrong
// `headingMagnetic` when the receiver only has a raw compass reading).

const HDG: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const compassDeg = utils.floatOrNull(parts[0]!)
  const deviationDeg = utils.magneticVariationOrNull(parts[1]!, parts[2]!)
  const variationDeg = utils.magneticVariationOrNull(parts[3]!, parts[4]!)

  const values: Array<{ path: string; value: unknown }> = []

  if (compassDeg !== null) {
    const effectiveDeviation = deviationDeg ?? 0
    values.push({
      path: 'navigation.headingMagnetic',
      value: utils.transform(compassDeg + effectiveDeviation, 'deg', 'rad')
    })
    // Emit the raw compass heading only when deviation is known — if
    // deviation is missing, `headingMagnetic` already equals the raw
    // value and a separate `headingCompass` path adds no information.
    if (deviationDeg !== null) {
      values.push({
        path: 'navigation.headingCompass',
        value: utils.transform(compassDeg, 'deg', 'rad')
      })
    }
    if (variationDeg !== null) {
      values.push({
        path: 'navigation.headingTrue',
        value: utils.transform(
          compassDeg + effectiveDeviation + variationDeg,
          'deg',
          'rad'
        )
      })
    }
  }

  if (variationDeg !== null) {
    values.push({
      path: 'navigation.magneticVariation',
      value: utils.transform(variationDeg, 'deg', 'rad')
    })
  }
  if (deviationDeg !== null) {
    values.push({
      path: 'navigation.magneticDeviation',
      value: utils.transform(deviationDeg, 'deg', 'rad')
    })
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

export default HDG
