'use strict'

/**
 * Copyright 2021 Signal K and Contributors>.
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

/** NMEA0183 GSV

$GPGSV,3,1,09,07,16,321,37,08,29,281,33,10,29,143,35,16,75,216,35,0*6E
$GPGSV,3,2,09,18,38,057,35,20,44,105,40,21,81,117,33,26,43,164,25,0*63
$GPGSV,3,3,09,27,62,289,41,0*5B
$GLGSV,3,1,10,65,14,112,18,71,15,018,11,72,25,069,31,77,10,181,30,0*79
$GLGSV,3,2,10,78,52,221,38,79,44,310,28,80,00,342,,81,35,261,40,0*7E
$GLGSV,3,3,10,87,41,052,31,88,75,350,33,0*73
$GAGSV,2,1,07,01,37,308,33,03,09,074,35,05,07,025,,13,85,237,31,0*7F
$GAGSV,2,2,07,15,39,060,33,21,63,228,39,26,30,239,40,0*44


 GSV - GNSS Satellites In View
   **
        0 1 2 3 4 5 6         n
        | | | | | | |         |
 $--GSV,x,x,x,x,x,x,x.........*hh<CR><LF>
   **
 Field Number:
  0) Number of sentences for full data
  1) sentence number
  2) Number of satellites in view
  3) Satellite PRN number
  4) Elevation, degrees
  5) Azimuth, degrees
  6) SNR - higher is better
  7) Satellite PRN number
  8) Elevation, degrees
  9) Azimuth, degrees
 10) SNR - higher is better
 11) Satellite PRN number
 12) Elevation, degrees
 13) Azimuth, degrees
 14) SNR - higher is better
 15) Satellite PRN number
 16) Elevation, degrees
 17) Azimuth, degrees
 18) SNR - higher is better
  n) Checksum
  
  note: NMEA 0183 4.11 has an , not used, extra field 19.

*/

const debug = require('debug')('signalk-parser-nmea0183/GSV')

const NUMBER_OF_SENTENCES = 0
const SENTENCE_NUMBER = 1
const SATS_IN_VIEW = 2

const SAT_DATA_BLOCK_START = 3
const SAT_DATA_LENGTH = 4

const OFFSET_ELEVATION = 1
const OFFSET_AZIMUTH = 2
const OFFSET_SNR = 3

const utils = require('@signalk/nmea0183-utilities')

module.exports = function (input, session) {
  const { parts, tags } = input

  const gsvData = session.gsvData || (session.gsvData = {
    nextSentenceNumber: 1,
    numberOfSentences: Number(parts[NUMBER_OF_SENTENCES]),
    count: Number(parts[SATS_IN_VIEW]),
    satellites: []
  })

  if (Number(parts[SENTENCE_NUMBER]) !== gsvData.nextSentenceNumber) {
    debug(`Expected sentence number to be ${gsvData.nextSentenceNumber} but got ${parts}`)
    delete session.gsvData
    return null
  }
  gsvData.nextSentenceNumber++

  for (let i = 0; i < 4; i++) {
    const thisSatDataStart = SAT_DATA_BLOCK_START + i * SAT_DATA_LENGTH
    const satPRN = parts[thisSatDataStart]
    if (!isNaN(satPRN)) {
      gsvData.satellites.push({
        id: Number(satPRN),
        elevation: utils.transform(parts[thisSatDataStart + OFFSET_ELEVATION], 'deg', 'rad'),
        azimuth: utils.transform(parts[thisSatDataStart + OFFSET_AZIMUTH], 'deg', 'rad'),
        SNR: Number(parts[thisSatDataStart + OFFSET_SNR])
      })
    }
  }

  if (Number(parts[SENTENCE_NUMBER]) === gsvData.numberOfSentences) {
    delete session.gsvData
    delete gsvData.nextSentenceNumber
    delete gsvData.numberOfSentences
    return {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [
            {
              path: 'navigation.gnss.satellitesInView',
              value: gsvData
            }
          ]
        }
      ]
    }
  }

  return null
}