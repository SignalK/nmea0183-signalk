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
56  M1  DD  YY  Date: YY year, M month, DD day in month
*/

module.exports = function (input, session) {
  const { id, sentence, parts, tags } = input

  var M = (parseInt(parts[1], 16) & 0xf0) >> 4
  var DD = parseInt(parts[2], 16)
  var YY = parseInt(parts[3], 16)

  var year = 2000 + YY
  var month = M
  var day = DD

  session['date'] = { year: year, month: month, day: day }

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
