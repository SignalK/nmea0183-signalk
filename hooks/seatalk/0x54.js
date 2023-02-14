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
54  T1  RS  HH  GMT-time:
                          HH hours, 6 MSBits of RST = minutes = (RS & 0xFC) / 4
                                    6 LSBits of RST = seconds =  ST & 0x3F
*/

module.exports = function (input, session) {
  const { id, sentence, parts, tags } = input

  var T = (parseInt(parts[1], 16) & 0xf0) >> 4
  var S = parseInt(parts[2], 16) & 0x0f
  var RS = parseInt(parts[2], 16)
  var HH = parseInt(parts[3], 16)

  var ST = (S << 4) + T

  var hour = HH
  var minute = (RS & 0xfc) / 4
  var second = ST & 0x3f
  var milliSecond = 0

  session['time'] = {
    hour: hour,
    minute: minute,
    second: second,
    milliSecond: milliSecond,
  }

  var pathValues = []

  if (session.hasOwnProperty('date') && session.hasOwnProperty('time')) {
    const d = new Date(
      Date.UTC(
        session['date'].year,
        session['date'].month - 1,
        session['date'].day,
        session['time'].hour,
        session['time'].minute,
        session['time'].second,
        session['time'].milliSecond
      )
    )
    const ts = d.toISOString()

    pathValues.push({
      path: 'navigation.datetime',
      value: ts,
    })
  }
  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues,
      },
    ],
  }
}
