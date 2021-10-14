'use strict'

/**
 * Copyright 2018 Signal K <info@signalk.org> and contributors.
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

const debug = require('debug')('signalk-parser-nmea0183/PNKEP')
const utils = require('@signalk/nmea0183-utilities')

/*
=== PNKEP,01 - NKE Target speed ===
------------------------------------------------------------------------------
       0   1  2   3 4  5
       |   |  |   | |  |
$PNKEP,01,x.x,N,x.x,K*hh<CR><LF>
------------------------------------------------------------------------------
$PNKEP,01,8.3,N,15.5,K*52
Field Number:
0: NKE Target speed sentence
1: Target speed in knots
2: N = knots
3: Target speed in km/h
4: K
5: Checksum

=== PNKEP,02 - Course (COG) on next track ===
------------------------------------------------------------------------------
       0   1   2
       |   |   |
$PNKEP,02,x.x*hh<CR><LF>
------------------------------------------------------------------------------
$PNKEP,02,344.4*6B
Field Number:
0: NKE Course on next tack sentence
1: Course on next tack from 0 to 359
2: Checksum

=== PNKEP,03 - NKE Opt. VMG angle and performance up and downwind ===
------------------------------------------------------------------------------
       0   1   2   3  4
       |   |   |   |  |
$PNKEP,03,x.x,x.x,x.x*hh<CR><LF>
------------------------------------------------------------------------------
$PNKEP,03,152.0,55.2,67.1*69
Field Number:
0: NKE Opt. VMG angle
1: Opt. VMG angle
2: performance upwind from 0 to 99% - ignored
3: performance downwind from 0 to 99% - ignored
4: Checksum
*/

function isEmpty(mixed) {
  return (
    (typeof mixed !== 'string' && typeof mixed !== 'number') ||
    (typeof mixed === 'string' && mixed.trim() === '')
  )
}

module.exports = function (input) {
  const { id, sentence, parts, tags } = input
  let values = []
  let delta = {}

  //PNKEP,01
  if (parts[0] === '01') {
    if (parts[1] === '' && parts[3] === '') {
      return null
    }

    let targetspeed = 0.0

    if (utils.float(parts[3]) > 0 && String(parts[4]).toUpperCase() === 'K') {
      targetspeed = utils.transform(utils.float(parts[3]), 'kph', 'ms')
    }

    if (utils.float(parts[1]) > 0 && String(parts[2]).toUpperCase() === 'N') {
      targetspeed = utils.transform(utils.float(parts[1]), 'knots', 'ms')
    }
    values.push({
      path: 'performance.targetSpeed',
      value: targetspeed,
    })
  }

  // PNKEP,02
  if (parts[0] === '02') {
    if (parts[1] === '') {
      return null
    }

    let nxtcourse = 0.0

    if (utils.float(parts[1]) > 0) {
      nxtcourse = utils.transform(utils.float(parts[1]), 'deg', 'rad')
    }

    values.push({
      path: 'performance.tackMagnetic',
      value: nxtcourse,
    })
  }

  // PNKEP,03
  if (parts[0] === '03') {
    if (parts[1] === '') {
      return null
    }

    let optcourse = 0.0

    if (utils.float(parts[1]) > 0) {
      optcourse = utils.transform(utils.float(parts[1]), 'deg', 'rad')
    }

    values.push({
      path: 'performance.targetAngle',
      value: optcourse,
    })
  }

  delta = {
    updates: [
      {
        source: tags.source, //this.source(input.instrument),
        timestamp: tags.timestamp,
        values: values,
      },
    ],
  }

  return delta
}
