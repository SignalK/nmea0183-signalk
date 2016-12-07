/*
 * Copyright 2016 Joachim Bakke
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



/*
 * STALK codec
 *
 * @repository
 * @author
 *
 */

"use strict";

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

var Codec = require('../lib/NMEA0183');
var datagrams = require('./stalk/')

module.exports = new Codec('STALK', function(multiplexer, input) {
  var values = input.values;
  multiplexer.self();

  var x = parseInt(values[0], 16);
  if(datagrams[x]) {
    return datagrams[x](values, multiplexer, input.instrument)
  }
  return false
});
