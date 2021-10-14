/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
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
00  02  YZ  XX XX  Depth below transducer: XXXX/10 feet
Flags in Y: Y&8 = 8: Anchor Alarm is active
Y&4 = 4: Metric display units or
Fathom display units if followed by command 65
Y&2 = 2: Used, unknown meaning
Flags in Z: Z&4 = 4: Transducer defective
Z&2 = 2: Deep Alarm is active
Z&1 = 1: Shallow Depth Alarm is active
*/

module.exports = function (input) {
  const { id, sentence, parts, tags } = input

  var Y = parseInt(parts[2].charAt(0), 16)
  var Z = parseInt(parts[2].charAt(1), 16)
  var s = 1
  var XXXX =
    parseInt(parts[3], 16) + ((parseInt(parts[4], 16) & 0x7f & 0xffff) << 8)
  var depthbelowtransducer = (0.3048 * XXXX) / 10.0
  if ((parseInt(parts[3], 16) & 0x80) != 0) {
    s = -1
  }

  var modeY
  if ((Y & 8) == 8) {
    var mode = 'AnchorAlarmActive'
  }
  if ((Y & 4) == 4) {
    var mode = 'MetricDisplayOrFathom'
  }
  if ((Y & 2) == 2) {
    var mode = 'UnknownMeaning'
  }

  var modeZ
  if ((Z & 4) == 4) {
    var mode = 'TransducerDefective'
  }
  if ((Z & 2) == 2) {
    var mode = 'DeepAlarm'
  }
  if ((Z & 1) == 1) {
    var mode = 'ShallowDepthAlarm'
  }

  var pathValues = []

  pathValues.push({
    path: 'environment.depth.belowTransducer',
    value: depthbelowtransducer,
  })

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
