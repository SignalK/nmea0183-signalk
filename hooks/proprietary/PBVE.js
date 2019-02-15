'use strict'

/**
 * Copyright 2019 Signal K <info@signalk.org>.
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



const debug = require('debug')('signalk-parser-nmea0183/PBVE')
const utils = require('@signalk/nmea0183-utilities')

/*

OP30 digital oil pressure gauge sample NMEA sentence:

Sentence: $PBVE,DGOIADNNACAEACAAABBLAAEBAACMCFAAEPAIKI*37

      0 1   2    3   4  5  6  7   8    9  10  11   12  13 14
      | |   |    |   |  |  |  |   |    |  |   |    |   |  |    
$PBVE,x,x,xxxx,xxxx,xx,xx,xx,xx,xxxx,xxxx,xx,xxxx,xxxx,xx*xx
      D G OIAD NNAC AE AC AA AB BLAA EBAA CM CFAA EPAI KI*37

0: Product code: D = OP 30/60
1: Software version: G = ???
2: Oil pressure calibration number: OIAD = 14 8 0 3 = ???
3: A2D gain: NNAC = ???
4: Sender Type: AE = 4
5: Backlight level: AC = 2
6: Units of measure: AA = psi
7: Built in alarms armed: AB = 1 = true
8: Low pressure alarm value: BLAA = 1 11 0 0 = ???
9: High pressure alarm value: EBAA =  4 1 0 0 = ??? 
10: Checksum for Non-Volatile Memory: CM = 2 12 = ???
11: Oil Pressure: CFAA = 37
12: Sensor Volts: EPAI = 4 15 0 8 = ???
13: Checksum: KI = 10 8
14: Checksum: 37

Where A=0, B=1, C=2, ... , O=14, P=15

Decode Oil Pressure as:
CFAA = 16*M + L + 4096*A + 256*A
CFAA = 16*2 + 5 + 4096*0 + 256*0
CFAA = 37 psi

//ALPHA is an array map for converting sentence codes from letters to numbers
//A=0, B=1, etc

*/
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/*
 @function convertAlphasToInts
 @param alphas String
 @return Array
*/
function convertAlphasToInts(alphas){
  alphas = alphas.split('')
  var replacement = [];
  for(var i = 0; i < alphas.length;i++){
    const indexValue = ALPHA.indexOf(alphas[i]);
    replacement.push(indexValue)
  }
  return replacement;
}


/*
 @function convertToOilPressure
 @param values Array
 @return Int
*/
function convertToOilPressure(values){
  return (16 * values[0]) + values[1] + (4096 * values[2]) + (256 * values[3])
}

module.exports = function(input) {
  const { id, sentence, parts, tags } = input

  let values = []
  let delta = {}

  const data = parts[0]
  const productCode = data.substr(0,1)

  if(productCode !== 'D'){
    debug('Unsupported CruzPro instrument type')
    return;
  }

  const convertedValue =  convertAlphasToInts(data.substr(28,4))
  const oilPressure = convertToOilPressure(convertedValue)

  const oilPressureValue = {
    path: 'propulsion.0.oilPressure',
    value: oilPressure
  }

  delta = {
    updates: [{
      source: tags.source,
      timestamp: tags.timestamp,
      values: [oilPressureValue]
    }]
  }

  return delta
}
