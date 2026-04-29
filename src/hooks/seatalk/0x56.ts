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

import type {
  Delta,
  DeltaValue,
  HookFn,
  ParserInput,
  ParserSession
} from '../../types'
import type { SessionDate, SessionTime } from './seatalk-session-types'

/*
56  M1  DD  YY  Date: YY year, M month, DD day in month
*/

const S56: HookFn = function (
  input: ParserInput,
  session: ParserSession
): Delta | null {
  const { parts, tags } = input

  const M = (parseInt(parts[1]!, 16) & 0xf0) >> 4
  const DD = parseInt(parts[2]!, 16)
  const YY = parseInt(parts[3]!, 16)

  const year = 2000 + YY
  const month = M
  const day = DD

  session['date'] = { year, month, day } satisfies SessionDate

  const pathValues: DeltaValue[] = []

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

export default S56
