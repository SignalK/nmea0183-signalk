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
const loadSubHooks = require('../lib/loadSubhooks')
const path = require('path').join(__dirname, './seatalk')
const folderName = 'seatalk'
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

const subHooks = loadSubHooks(folderName)

module.exports = function(parser, input) {
  const { id, sentence, parts, tags } = input
  const key = '0x' + parseInt(parts[0],16).toString(16).toUpperCase()
  if (key in subHooks){
    return require(`${path}/${key}`)(parser, input)
  } else {
    return null
  }
}
