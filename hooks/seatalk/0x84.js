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

'use strict'

 const utils = require('@signalk/nmea0183-utilities')

/*
84  U6  VW  XY 0Z 0M RR SS TT  Compass heading  Autopilot course and
                  Rudder position (see also command 9C)
                  Compass heading in degrees:
                    The two lower  bits of  U * 90 +
                    the six lower  bits of VW *  2 +
                    number of bits set in the two higher bits of U =
                    (U & 0x3)* 90 + (VW & 0x3F)* 2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1): 0)
                  Turning direction:
                    Most significant bit of U = 1: Increasing heading, Ship turns right
                    Most significant bit of U = 0: Decreasing heading, Ship turns left
                  Autopilot course in degrees:
                    The two higher bits of  V * 90 + XY / 2
                  Z & 0x2 = 0 : Autopilot in Standby-Mode
                  Z & 0x2 = 2 : Autopilot in Auto-Mode
                  Z & 0x4 = 4 : Autopilot in Vane Mode (WindTrim), requires regular "10" datagrams
                  Z & 0x8 = 8 : Autopilot in Track Mode
                  M: Alarms + audible beeps
                    M & 0x04 = 4 : Off course
                    M & 0x08 = 8 : Wind Shift
                  Rudder position: RR degrees (positive values steer right,
                    negative values steer left. Example: 0xFE = 2° left)
                  SS & 0x01 : when set, turns off heading display on 600R control.
                  SS & 0x02 : always on with 400G
                  SS & 0x08 : displays “NO DATA” on 600R
                  SS & 0x10 : displays “LARGE XTE” on 600R
                  SS & 0x80 : Displays “Auto Rel” on 600R
                  TT : Always 0x08 on 400G computer, always 0x05 on 150(G) computer
*/

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input
  var mode

  var U = parseInt(parts[1].charAt(0), 16)
  var VW = parseInt(parts[2], 16)
  var V = parseInt(parts[2].charAt(0), 16)
  var XY = parseInt(parts[3], 16)
  var Z = parseInt(parts[4].charAt(1), 16)
  var M = parseInt(parts[5].charAt(1), 16)
  var RR = parseInt(parts[6], 16)
  var SS = parseInt(parts[7], 16)
  var TT = parseInt(parts[8], 16)
  var compassHeading = (U & 0x3) * 90 + (VW & 0x3F) * 2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1) : 0)
  var apCourse = ((V & 0xC) >> 2) * 90 + XY / 2
  /*Positive to right*/
  var rudderPos = RR
  if(rudderPos > 127) {
    rudderPos = rudderPos - 256
  }

  var modeVar = (Z & 0x2)
  switch(modeVar) {
    case 0:
      mode = "standby"
      break
    case 2:
      mode = "auto";
      break
    default:
      break
  }
  if((Z & 0x4) == 4) {
    mode = "wind"
  }
  if((Z & 0x8) == 8) {
    mode = "route"
  }
  var pathValues = []
  if(compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: utils.transform(utils.float(compassHeading), 'deg', 'rad')
    })
  }
  if(apCourse) {
    pathValues.push({
      path: 'steering.autopilot.target.headingMagnetic',
      value: utils.transform(utils.float(apCourse), 'deg', 'rad')
    })
  }
  if(rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: utils.transform(utils.float(rudderPos), 'deg', 'rad')
    })
  }
  if(mode) {
    pathValues.push({
      path: 'steering.autopilot.state',
      value: mode
    })
  }

  try {

    const delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: pathValues
        }
      ],
    }


    return Promise.resolve({ delta })
  } catch (e) {
    return Promise.reject(e)
  }
}
