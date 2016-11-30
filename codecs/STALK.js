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

$STALK,84,E6,15,00,00,00,00,00,08*1E
$STALK,9C,E1,15,00*4B
*/

var Codec = require('../lib/NMEA0183');

module.exports = new Codec('STALK', function(multiplexer, input) {
  var values = input.values;

multiplexer.self();

var x = parseInt(values[0], 16);
switch(x){
case 0x00:	/*depth*/
  break;
case 0x10:	/*Wind angle*/
  break;
case 0x11:	/*Wind speed*/
  break;
case 0x20:	/*Speed through water*/
  break;
case 0x21:	/*Trip Mileage*/
  break;
case 0x22:	/*Total Mileage*/
  break;
case 0x23:	/*Water Temperature*/
  break;
case 0x25:	/*Total Trip & Log*/
  break;
case 0x26:	/*Speed Through Water*/
  break;
case 0x27:	/*Water Temperature*/
  break;
case 0x30:	/*Set Lamp intensity*/
  break;
case 0x50:	/*Latitude*/
  break;
case 0x51:	/*Longitude*/
  break;
case 0x52:	/*Speed over Ground*/
  break;
case 0x53:	/*Magnetic Course*/
  break;
case 0x54:	/*UTC Time*/
  break;
case 0x56:	/*Date*/
  break;
case 0x80:	/*Set lamp intensity*/
  break;
case 0x84:	/*Compass heading and turning direction, autopilot course, active mode (standby, auto , wind, track) and rudden position*/
  var U = values[1].charAt(0);
  var VW = values[2];
  var V = values[2].charAt(0);
  var XY = values[3];
  var Z = values[4].charAt(1);
  var M = values[5].charAt(1);
  var RR = values[6];
  var SS = values[7];
  var TT = values[8];
  var compassHeading = (U & 0x3)*90 + (VW & 0x3F) *2 + (U & 0xC ? (U & 0xC == 0xC ? 2 : 1): 0) 
  var apCourse = (V & 0xC)*90 + (parseInt(XY) / 2)
  var rudderPos = parseInt(RR); 	/*Positive to right*/
  switch(Z & 0x2){
    case 0: var mode = "standby";
    case 2: var mode = "auto";
    case 4: var mode = "wind";
    case 8: var mode = "route";
    default: break;
    }
  var pathValues = []
  if (compassHeading) {
    pathValues.push({
      path: 'navigation.headingMagnetic',
      value: this.transform(this.float(compassHeading), 'deg', 'rad')
    })
  }
  if (apCourse) {
    pathValues.push({
      path: 'steering.autopilot.target.headingMagnetic',
      value: this.transform(this.float(apCourse), 'deg', 'rad')
    })
  }
  if (rudderPos) {
    pathValues.push({
      path: 'steering.rudderAngle',
      value: this.transform(this.float(rudderPos), 'deg', 'rad')
    })
  }
  if (mode) {
    pathValues.push({
      path: 'steering.autopilot.state',
      value: mode
    })
  }                

  if (pathValues.length > 0) {
    multiplexer.add({
      "updates": [{
        "source": this.source(input.instrument),
        "timestamp": this.timestamp(),
        "values": pathValues
      }],
      "context": multiplexer._context
    });
  }
  return true;

  break;
case 0x85:	/*Navigation to waypoint information*/
  break;
case 0x86:	/*Keystroke*/
  break;
case 0x87:	/*Set response level*/
  break;
case 0x88:	/*Autopilot Parameter*/

  break;
case 0x89:	/*Compass heading sent by ST40 compass instrument*/
  break;
case 0x91:	/*Set rudder gain*/
  break;
case 0x92:	/*Set autopilot parameter*/
  break;
case 0x99: 	/*Compass variation*/
  break;
case 0x9C:	/*Compass heading and turning direction*/

  break;
default:
  break;
}

});

