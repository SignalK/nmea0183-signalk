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

import type { Delta, HookFn, ParserInput, ParserSession } from '../../types'
import type { SessionDate, SessionTime } from './seatalk-session-types'

/*
54  T1  RS  HH  GMT-time:
                          HH hours, 6 MSBits of RST = minutes = (RS & 0xFC) / 4
                                    6 LSBits of RST = seconds =  ST & 0x3F
*/

const S54: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { parts, tags } = input

  var T = (parseInt(parts[1]!, 16) & 0xf0) >> 4
  var S = parseInt(parts[2]!, 16) & 0x0f
  var RS = parseInt(parts[2]!, 16)
  var HH = parseInt(parts[3]!, 16)

  var ST = (S << 4) + T

  var hour = HH
  var minute = (RS & 0xfc) / 4
  var second = ST & 0x3f
  var milliSecond = 0

  session['time'] = {
    hour: hour,
    minute: minute,
    second: second,
    milliSecond: milliSecond
  } satisfies SessionTime

  const pathValues: Array<{ path: string; value: unknown }> = []

  const dateEntry = session['date'] as SessionDate | undefined
  const timeEntry = session['time'] as SessionTime | undefined
  if (dateEntry && timeEntry) {
    const d = new Date(
      Date.UTC(
        dateEntry.year,
        dateEntry.month - 1,
        dateEntry.day,
        timeEntry.hour,
        timeEntry.minute,
        timeEntry.second,
        timeEntry.milliSecond
      )
    )
    const ts = d.toISOString()

    pathValues.push({
      path: 'navigation.datetime',
      value: ts
    })
  }
  return {
    updates: [
      {
        source: tags.source,
        timestamp: tags.timestamp,
        values: pathValues
      }
    ]
  }
}

export default S54
