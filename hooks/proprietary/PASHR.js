'use strict'

/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const debug = require('debug')('signalk-parser-nmea0183/PASHR');
const utils = require('@signalk/nmea0183-utilities');
const moment = require('moment-timezone');

/*
=== PASHR - RT300 proprietary roll and pitch sentence ===
Attitude/State provided by an IMU sensor.
------------------------------------------------------------------------------
         0           1   2    3      4      5     6     7     8   9 10 11
         |           |   |    |      |      |     |     |     |   | |  |
$PASHR,hhmmss.sss,hhh.hh,T,rrr.rr,ppp.pp,xxx.xx,a.aaa,b.bbb,c.ccc,d,e*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. hhmmss.sss - UTC time
1. hhh.hh - Heading in degrees
2. T - flag to indicate that the Heading is True Heading (i.e. to True North)
3. rrr.rr - Roll Angle in degrees
4. ppp.pp - Pitch Angle in degrees
5. xxx.xx - Heave
6. a.aaa - Roll Angle Accuracy Estimate (Stdev) in degrees
7. b.bbb - Pitch Angle Accuracy Estimate (Stdev) in degrees
8. c.ccc - Heading Angle Accuracy Estimate (Stdev) in degrees
9. d - Aiding Status
10. e - IMU Status
11. hh - Checksum
*/

function isEmpty(mixed){
  return ((typeof mixed !== 'string' && typeof mixed !== 'number') || (typeof mixed === 'string' && mixed.trim() === ''))
}

module.exports = function(input){
  const { id, sentence, parts, tags } = input;

  const empty = parts.reduce((e, val) => {
    if( isEmpty(val) ){
      ++e
    }
    return e
  }, 0);

  if( empty > 3 ){
    return null
  }

  const time = parts[0].indexOf('.') === -1 ? parts[0] : parts[0].split('.')[0];
  const timestamp = utils.timestamp(time, moment.tz('UTC').format('DDMMYY'));

  const GPSQualityFlags = [
    'no GPS',
    'All non-RTK fixed integer positions',
    'RTK fixed integer position'
  ];

  const INSStatusFlag = [
    'Pre-Alignment',
    'Post-Alignment'
  ];

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: timestamp,
        values: [
          {
            path: 'navigation.attitude',
            value: {
              heading: Number(parts[1]),
              roll: Number(parts[3]),
              pitch: Number(parts[4])
            }
          },
          {
            path: 'navigation.attitude.accuracy',
            value: {
              heading: Number(parts[8]),
              roll: Number(parts[6]),
              pitch: Number(parts[7])
            }
          },
          {
            path: 'navigation.attitude.heading',
            value: {
              heading: Number(parts[1]),
              true: parts[2] === "T"
            }
          },
          {
            path: 'navigation.attitude.heading.true',
            value: parts[2] === "T"
          },
          {
            path: 'navigation.attitude.heave',
            value: Number(parts[5])
          },
          {
            path: 'navigation.attitude.aid',
            value: GPSQualityFlags[utils.int(parts[9])]
          },

          {
            path: 'navigation.attitude.status',
            value: INSStatusFlag[utils.int(parts[10])]
          },
        ]
      }
    ],
  };

  const toRemove = [];

  delta.updates[0].values.forEach((update, index) => {
    if( typeof update.value === 'undefined' || update.value === null || (typeof update.value === 'string' && update.value.trim() === '') || (typeof update.value === 'number' && isNaN(update.value)) ){
      toRemove.push(index)
    }
  });

  if( toRemove.length > 0 ){
    toRemove.forEach(index => {
      delta.updates[0].values.splice(index, 1)
    })
  }

  return delta
};