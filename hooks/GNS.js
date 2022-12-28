'use strict'

/**
 * Copyright 2022 Signal K.
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

const debug = require('debug')('signalk-parser-nmea0183/GGA')
const utils = require('@signalk/nmea0183-utilities')
const moment = require('moment-timezone')

/*
=== GNS - Fix Data ===
Time, Position and fix related data for a GPS receiver.
------------------------------------------------------------------------------
        0         1       2 3        4 5    6  7   8   9   10  11  12
        |         |       | |        | |    |  |   |   |   |   |   |
 $--GNS,hhmmss.ss,ddmm.mm,a,dddmm.mm,a,c--c,xx,x.x,x.x,x.x,x.x,x.x*hh<CR><LF>
------------------------------------------------------------------------------
Field Number:
0. UTC of position, hh is hours, mm is minutes, ss.ss is seconds
1. Latitude, dd is minutes, mm.mm is minutes
2. N or S (North or South)
3. Longitude, dd is minutes, mm.mm is minutes
4. E or W (East or West)
5. Mode indicator (non-null) - Variable character field with one character for each supported constellation:
    * First character is for GPS
    * Second character is for GLONASS
    * Third character is Galileo
    * Fourth character is for BeiDou
    * Fifth character is for QZSS
    * Subsequent characters will be added for new constellations
   Each character will be one of the following
     - N = No fix. Satellite system not used in position fix, or fix not valid
     - A = Autonomous. Satellite system used in non-differential mode in position fix
     - D = Differential (including all OmniSTAR services). Satellite system used in differential mode in position fix
     - P = Precise. Satellite system used in precision mode. Precision mode is defined as: no deliberate degradation (such as Selective Availability) and higher resolution code (P-code) is used to compute position fix
     - R = Real-Time Kinematic. Satellite system used in RTK mode with fixed integers
     - F = Float RTK. Satellite system used in real-time kinematic mode with floating integers
     - E = Estimated (dead reckoning) mode
     - M = Manual Input mode
     - S = Simulator mode
6. Total number of satellites in use, 00-99
7. Horizontal Dilution of Precision (HDOP), calculated using all the satellites (GPS, GLONASS, and any future satellites) and used in computing the solution reported in each GNS sentence
8. Antenna altitude, meters, re:mean-sea-level (geoid)
9. Goeidal separation meters - The difference between the earth ellipsoid surface and mean-sea-level (geoid) surface defined by the reference datum used in the position solution
10. Age of differential data - Null if talker ID is GN, additional GNS messages follow with Age of differential data
11. Differential reference station ID, 0000-4095 - Null if Talker ID is GN, Additional GNS messages follow with Reference station ID
12. Navigational status (added when the IEC61162-1:2010/NMEA 0183 V4.10 option is selected in the NMEA I/O configuration):
     - S = Safe
     - C = Caution
     - U = Unsafe
     - V = Not valid for navigation
13. Checksum
*/

function isEmpty(mixed) {
  return (
    (typeof mixed !== 'string' && typeof mixed !== 'number') ||
    (typeof mixed === 'string' && mixed.trim() === '')
  )
}

const MODES = {
  "A": "Autonomous",
  "D": "Differential",
  "E": "Estimated",
  "F": "RTK Float",
  "M": "Manual",
  "N": "No Valid Fix",
  "P": "Precise",
  "R": "RTK Integer",
  "S": "Simulator"
}

const SYSTEMS = ["GPS","GLONASS","Galileo","BeiDou","QZSS"]

function indicator(chars) {
  return chars.reduce( (acc, c, i) => {
    acc[SYSTEMS[i]] = MODES[c]
    return acc
  }, {})
}

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  const empty = parts.reduce((e, val) => {
    if (isEmpty(val)) {
      ++e
    }
    return e
  }, 0)

  if (empty > 4) {
    return null
  }

  const time = parts[0].indexOf('.') === -1 ? parts[0] : parts[0].split('.')[0]
  const timestamp = utils.timestamp(time, moment.tz('UTC').format('DDMMYY'))

  const STATUS = {
    "S": "Safe",
    "C": "Caution",
    "U": "Unsafe",
    "V": "Not Valid"
  }

  const delta = {
    updates: [
      {
        source: tags.source,
        timestamp: timestamp,
        values: [
          {
            path: 'navigation.position',
            value: {
              longitude: utils.coordinate(parts[3], parts[4]),
              latitude: utils.coordinate(parts[1], parts[2]),
            },
          },
          {
            path: 'navigation.gnss.methodQuality',
            value: indicator(parts[5].split("")),
          },

          {
            path: 'navigation.gnss.satellites',
            value: utils.int(parts[6]),
          },

          {
            path: 'navigation.gnss.antennaAltitude',
            value: utils.float(parts[8]),
          },

          {
            path: 'navigation.gnss.horizontalDilution',
            value: utils.float(parts[7]),
          },

          {
            path: 'navigation.gnss.geoidalSeparation',
            value: utils.float(parts[9]),
          },

          {
            path: 'navigation.gnss.differentialAge',
            value: utils.float(parts[10]),
          },

          {
            path: 'navigation.gnss.differentialReference',
            value: Number(parts[11]),
          },
          {
            path: 'navigation.gnss.status',
            value: STATUS[(parts[12])],
          },
        ],
      },
    ],
  }

  const toRemove = []

  delta.updates[0].values.forEach((update, index) => {
    if (
      typeof update.value === 'undefined' ||
      update.value === null ||
      (typeof update.value === 'string' && update.value.trim() === '') ||
      (typeof update.value === 'number' && isNaN(update.value))
    ) {
      toRemove.push(index)
    }
  })

  if (toRemove.length > 0) {
    toRemove.forEach((index) => {
      delta.updates[0].values.splice(index, 1)
    })
  }

  return delta
}
