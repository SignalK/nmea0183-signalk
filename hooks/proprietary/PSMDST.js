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

/*
0       1 2  3  4  5
|       | |  |  |  |
$PSMDST,Z,xx,yy,nn*CS
where:
0       PSMDST     	Raymarine Seatalk1 datagram sentence
1       C/R       R for Received messages, C for sent messages *Note: This field only exists in later firmware versions of the ShipModul Miniplex
2 			00-9C     Datagram type
3 			hex       First datagram content
4 			hex   		Last datagram content
5 			hex      	Checksum
*/

const seatalkHooks = require('../seatalk')

module.exports = function (input, session) {
  const { id, sentence, parts, tags } = input
  if (parts[0].toUpperCase() === 'R') {
    input.parts = parts.slice(1, input.parts.length);
  }
  const key = '0x' + input.parts[0].toUpperCase();
  if (typeof seatalkHooks[key] === 'function') {
    return seatalkHooks[key](input, session)
  } else {
    return null
  }
}
