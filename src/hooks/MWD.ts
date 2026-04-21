/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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
 * $WIMWD,<0>,<1>,<2>,<3>,<4>,<5>,<6>,<7>*hh
 *
 * NMEA 0183 standard Wind Direction and Speed, with respect to north.
 *
 * <0> Wind direction, 0.0 to 359.9 degrees True, to the nearest 0.1 degree
 * <1> T = True
 * <2> Wind direction, 0.0 to 359.9 degrees Magnetic, to the nearest 0.1 degree
 * <3> M = Magnetic
 * <4> Wind speed, knots, to the nearest 0.1 knot.
 * <5> N = Knots
 * <6> Wind speed, meters/second, to the nearest 0.1 m/s.
 * <7> M = Meters/second
 */

const MWD: HookFn = function (
  input: ParserInput,
  _session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const directionTrue =
    parts[1]! === 'T' ? utils.transformOrNull(parts[0]!, 'deg', 'rad') : null
  const directionMagnetic =
    parts[3]! === 'M' ? utils.transformOrNull(parts[2]!, 'deg', 'rad') : null

  if (directionTrue === null && directionMagnetic === null) {
    return null
  }

  // Prefer m/s over knots when both are present — the native unit
  // avoids an extra conversion round-trip.
  const msSpeed = parts[7]! === 'M' ? utils.floatOrNull(parts[6]!) : null
  const knotsSpeed =
    parts[5]! === 'N' ? utils.transformOrNull(parts[4]!, 'knots', 'ms') : null
  const speed = msSpeed ?? knotsSpeed

  if (speed === null) {
    return null
  }

  const values: DeltaValue[] = []
  if (directionTrue !== null) {
    values.push({
      path: 'environment.wind.directionTrue',
      value: directionTrue
    })
  }
  if (directionMagnetic !== null) {
    values.push({
      path: 'environment.wind.directionMagnetic',
      value: directionMagnetic
    })
  }
  values.push({ path: 'environment.wind.speedTrue', value: speed })

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

export default MWD
