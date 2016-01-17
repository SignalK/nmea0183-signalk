/*
* HDT codec
*
* @repository https://github.com/signalk/nmea-signalk
* @author Bob Moriarty <bobmor99@gmail.com>
*
*
* Copyright 2015, Bob Moriarty
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*/

"use strict";

/*
=== HDT - Heading True ===

------------------------------------------------------------------------------
*******0   1 2
*******|   | |
$--HDT,x.x,T*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

0. Heading True
1. T = True
2. Checksum
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('HDT', function(multiplexer, input) {
  var values = input.values;
  var self = this;
  var vals = [
    { path: 'headingTrue', value: self.transform(self.float(values[0]), 'deg', 'rad') }
  ];

  multiplexer
    .self()
    .group('navigation')
    .source(this.source())
    .timestamp(this.timestamp())
    .values(vals)
  ;
  return true;
});
