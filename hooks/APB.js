'use strict'

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
 
const debug = require('debug')('signalk-parser-nmea0183/APB')
const utils = require('@signalk/nmea0183-utilities')

/*

       0 1    2 3 4 5 6   7 8    9  10  11 12
       | |    | | | | |   | |    |   |  |  |
$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C 
where:
        APB       Autopilot format B
0       A         Loran-C blink/SNR warning, general warning 
1       A         Loran-C cycle warning 
2       0.10      cross-track error distance 
3       R         steer Right to correct (or L for Left) 
4       N         cross-track error units - nautical miles (K for kilometers) 
5       V         arrival alarm - circle 
6       V         arrival alarm - perpendicular 
7,8     011,M     magnetic bearing, origin to destination 
9       DEST      destination waypoint ID 
10,11   011,M     magnetic bearing, present position to destination 
12,13   011,M     magnetic heading to steer (bearings could True as 033,T) 
*3C     Checksum

*/

module.exports = function (parser, input) {
  try {
    const { id, sentence, parts } = input
    
    if(parts[0].toUpperCase() == 'V') {
      // Don't parse this sentence as it's void.
      return Promise.reject(new Error('Not parsing sentence for it\'s void (LORAN-C blink/SNR warning)'))
    }

    if(parts[1].toUpperCase() == 'V') {
      return Promise.reject(new Error('Not parsing sentence for it\'s void (LORAN-C cycle warning)'))
    }

    const xte = utils.transform(parts[2], (parts[4].toUpperCase() === 'N' ? 'nm' : 'km'), 'm')

    const currentRoute = {
      source: utils.source(id),
      timestamp: utils.timestamp(),
      steer: (parts[3].toUpperCase() == 'R' ? 'right' : 'left'),
      bearingActual: utils.transform(utils.float(parts[10]), 'deg', 'rad'),
      bearingDirect: utils.transform(utils.float(parts[7]), 'deg', 'rad'),
      courseRequired: utils.transform(utils.float(parts[12]), 'deg', 'rad'),
      waypoint: {
        next: parts[9],
        xte: xte
      }
    }
    
    return Promise.reject(new Error('@FIXME: APB hook needs to be rewritten to fit latest version of SK'))
  } catch (e) {
    debug(`Try/catch failed: ${e.message}`)
    return Promise.reject(e)
  }
}