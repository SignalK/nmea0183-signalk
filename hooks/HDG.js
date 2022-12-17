'use strict'

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

const debug = require('debug')('signalk-parser-nmea0183/HDG')
const utils = require('@signalk/nmea0183-utilities')

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

function isEmpty(mixed) {
  return (
    (typeof mixed !== 'string' && typeof mixed !== 'number') ||
    (typeof mixed === 'string' && mixed.trim() === '')
  )
}

module.exports = function (input) {
  const { parts, tags } = input
  const values = []

  const headingCompass = parts[0]
  const deviation = parts[1]
  const deviationDir = parts[2] === 'E' ? 1 : -1
  const variation = parts[3]
  const variationDir = parts[4] === 'E' ? 1 : -1
  if (!isEmpty(headingCompass)) {
    const effectiveDeviation = !isEmpty(deviation) ? Number(deviation) * deviationDir : 0
    values.push({
      path: 'navigation.headingMagnetic',
      value: utils.transform(utils.float(headingCompass) + effectiveDeviation, 'deg', 'rad'),
    })
    if (!isEmpty(deviation)) {
      values.push({
        path: 'navigation.headingCompass',
        value: utils.transform(utils.float(headingCompass), 'deg', 'rad'),
      })  
    }
    if (!isEmpty(variation)) {
      const effectiveVariation = variation * variationDir
      values.push({
        path: 'navigation.headingTrue',
        value: utils.transform(utils.float(headingCompass) + effectiveDeviation + effectiveVariation, 'deg', 'rad'),
      })  
    }
  }
  if (!(isEmpty(variation) || isEmpty(variationDir))) {
    values.push({
      path: 'navigation.magneticVariation',
      value:
        utils.transform(utils.float(variation), 'deg', 'rad') *
        variationDir,
    })
  }
  if (!(isEmpty(deviation) || isEmpty(deviationDir))) {
    values.push({
      path: 'navigation.magneticDeviation',
      value:
        utils.transform(utils.float(deviation), 'deg', 'rad') *
        deviationDir,
    })
  }
  if (!values.length) {
    return null
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values,
      },
    ],
  }

  return delta
}
