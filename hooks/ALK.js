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
0  1  2  3
|  |  |  |
$STALK,xx,yy,nn*CS
where:
STALK     	Raymarine Seatalk1 datagram sentence
0 			00-9C       	Datagram type
1 			hex       	First datagram content
2 			hex   		Last datagram content
3 			hex      	Checksum
*/

const seatalkHooks = require('./seatalk')

module.exports = function(input) {
  const { id, sentence, parts, tags } = input
  const key = '0x' + (parts[0]).toUpperCase()
  if (typeof seatalkHooks[key] === 'function'){
    return seatalkHooks[key](input)
  } else {
    return null
  }
}
