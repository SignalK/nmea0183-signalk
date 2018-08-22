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
25  Z4  XX  YY  UU  VV AW  Total & Trip Log 
                      total= (XX+YY*256+Z* 4096)/ 10 [max=104857.5] nautical miles 
                      trip = (UU+VV*256+W*65536)/100 [max=10485.75] nautical miles
*/

module.exports = function (parser, input) {
  const { id, sentence, parts, tags } = input

  var Z = (parseInt(parts[1],16) & 0xF0) >> 4;
  var XX = parseInt(parts[2],16)
  var YY = parseInt(parts[3],16)
  var UU = parseInt(parts[4],16)
  var VV = parseInt(parts[5],16)
  var W = (parseInt(parts[6],16) & 0x0F);

  var total= (XX+YY*256+Z*4096)/10.0
  var trip = (UU+VV*256+W*65536)/100.0

  var pathValues = []
  
  pathValues.push({
    path: 'navigation.trip',
    value: utils.transform(utils.float(trip), 'nm', 'km') * 1000
  })

  pathValues.push({
    path: 'navigation.log',
    value: utils.transform(utils.float(total), 'nm', 'km') * 1000
  })
               
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
