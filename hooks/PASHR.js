/**
 * Copyright 2019 Signal K and Fabian Tollenaar <fabian@decipher.industries>.
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

const debug = require('debug')('signalk-parser-nmea0183/PASHR')
const utils = require('@signalk/nmea0183-utilities')

/**
 * $PASHR,225444.123,125.12,T,12.45,11.91,xxx.xx,1.123,1.456,2.653,1,4*38
 *
 * Roll and pitch information - https://help.fieldsystems.trimble.com/r780/nmea0183-messages-pashr.htm
 *
 * 0)     225444.123        UTC time of fix 22:54:44.123
 * 1,2)   125.12,T          True Heading, flag to indicate that the Heading is True Heading
 * 3)     12.45             Roll Angle in degrees
 * 4)     11.91             Pitch Angle in degrees
 * 5)     xxx.xx            Reserved Field (Not Supported)
 * 6)     1.123             Roll Angle accuracy estimate in degrees
 * 7)     1.456             Pitch Angle accuracy estimate in degrees
 * 8)     2.653             Heading Angle accuracy estimate in degrees
 * 9)     1                 GNSS Quality [0-6]
 * 10)    4                 IMU Alignment Status [0-4]
 **/


module.exports = function PASHRHook(input) {
  const { id, sentence, parts, tags } = input

  debug(`[PASHRHook] decoding sentence ${id} => ${sentence}`)

  let state = {
    timestamp: utils.timestamp(parts[0]),
    trueHeading: parts[2] == 'T' ? parts[1] : null,
    rollAngle: parts[3],
    pitchAngle: parts[4],
    rollAngleAccuracy: parts[6],
    pitchAngleAccuracy: parts[7],
    trueHeadingAccuracy: parts[8],
  }

  return {
    updates: [
      {
        timestamp: state.timestamp,
        source: tags.source,
        values: [
          {
            path: 'navigation.headingTrue',
            value: state.trueHeading ? utils.transform(utils.float(state.trueHeading), 'deg', 'rad') : null,
          },
          {
            path: 'balance.rollAngle',
            value: utils.transform(utils.float(state.rollAngle), 'deg', 'rad'),
          },
          {
            path: 'balance.pitchAngle',
            value: utils.transform(utils.float(state.pitchAngle), 'deg', 'rad'),
          },
          {
            path: 'balance.rollAngleAccuracy',
            value: utils.transform(utils.float(state.rollAngleAccuracy), 'deg', 'rad'),
          },
          {
            path: 'balance.pitchAngleAccuracy',
            value: utils.transform(utils.float(state.pitchAngleAccuracy), 'deg', 'rad'),
          },
          {
            path: 'navigation.headingTrueAccuracy',
            value: state.trueHeading ? utils.transform(utils.float(state.trueHeadingAccuracy), 'deg', 'rad') : null,
          }
        ],
      },
    ],
  }
}
