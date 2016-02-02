/* 
* RPM codec 
* 
* @repository https://github.com/signalk/nmea-signalk 
* @author Joachim Bakke, joabakk 
* 
* 
* Copyright 2016, Joachim Bakke 
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
# ROT - Rate Of Turn
#        0   1 2
#        |   | |
# $--ROT,x.x,A*hh<CR><LF>
# Field Number:
#
# 0 - Rate Of Turn, degrees per minute, "-" means bow turns to port
# 1 - Status, A means data is valid
# 2 - Checksum
# RPM - Revolutions
#
*/ 

var Codec = require('../lib/NMEA0183');
module.exports = new Codec('ROT', function(multiplexer, input) {
  var values = input.values;
  //var ts 	 = this.timestamp(time);

	multiplexer.self();

  multiplexer.add({
    "updates": [{
      "source": this.source(input.instrument),
      "timestamp": this.timestamp(),//ts,
      "values": [{
        "path": "navigation.rateOfTurn",
        "value": this.float(values[0])
      }]
    }],
    "context": multiplexer._context
  });
	return true;
});
