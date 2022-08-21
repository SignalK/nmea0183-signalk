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
const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const schema = {

/*
Sentence: $PBVE,BJAAAOAAABNCANIIBDAAPHABAAAACCABAAADAAHCJPACDIBOACAAGL
Parse as:
$PBVE,B,J,AA,AOAA,AB,NCAN,IIBD,AAPH,AB,AAAA,CC,ABAA,ADAA,HC,JP,ACDI,BO,AC,AAGL
(https://www.electronicspoint.com/forums/threads/engine-hour-meter-with-nmea-output.159207/)


0: (0:1)    B    : Product Code =  B = RH30
1: (1:1)    J    : Software Version # 
2: (2:2)    AA   : Spare NMV Byte (Ignore) 
3: (4:4)    AOAA : Display Damping  
4: (8:2)    AB   : Ignore
5: (10:4)   NCAN : Maximum RPM seen from last reset
6: (14:4)   IIBD : High RPM Alarm value
7: (18:4)   AAPH : Clock Speed Calibration #
8: (22:2)   AB   : Backlight Level
9: (24:4)   AAAA : Maintenance count-down alarm
10: (28:2)  CC   : Engine Minutes
11: (30:4)  ABAA : Engine Hours
12: (34:4)  ADAA : RPM Calibration number
14: (38:2)  HC   : Mode
15: (40:2)  JP   : Non voltatile memory checksum
16: (42:4)  ACDI : RPM
17: (46:2)  BO   : Elapsed Seconds
18: (48:2)  AC   : Elapsed Minutes
19: (50:4)  AAGL : Elapsed Hours.

Where A=0, B=1, C=2, ... , O=14, P=15

Decode RPM as:
ADAA = 16*A + D + 4096*A + 256*A
ADAA = 16*0 + 3 + 4096*0 + 256*0
ADAA = 3 RPM

Decode Engine Minutes as:
CC = 16*C + C
CC = 16*2 + 2
CC = 32 Engine Minutes

*/
  B: {
    meta: {
      description: 'CruzPro RH30/RH60/RH110 Digital RPM/Engine Hours/Elapsed Time',
      displayName: 'Engine RPM/Hours',
      shortName: 'ERPM',
      warnMethod: ['visual'],
      alarmMethod: ['sound'],
      gaugeAlarmOn: false,
      backlight: 0,
      zones: [],
      originalValue: null,
  },
},

  /*

Note: oil pressure calculation formulas are the same for all instruments


OP30/OP60 digital oil pressure gauge sample NMEA sentence:

Sentence: $PBVE,DGOIADNNACAEACAAABBLAAEBAACMCFAAEPAIKI*37

      0 1   2    3   4  5  6  7   8    9  10  11   12  13 14
      | |   |    |   |  |  |  |   |    |  |   |    |   |  |    
$PBVE,x,x,xxxx,xxxx,xx,xx,xx,xx,xxxx,xxxx,xx,xxxx,xxxx,xx*xx
      D G OIAD NNAC AE AC AA AB BLAA EBAA CM CFAA EPAI KI*37

0: Product code: D = OP 30/60
1: Software version: G = ???
2: Oil pressure calibration number: OIAD = 14 8 0 3 = 256*3 + 16*14 +8 = 1000 = 1.000
3: A2D gain: NNAC = 13 13 0 3 =  256*03 + 16*13 +13= 989= 0.989 
4: Sender Type: AE = 4
5: Backlight level: AC = 2
6: Units of measure: AA = psi, otherwise bar
7: Built in alarms armed: AB = 1 = true
8: Low pressure alarm value: BLAA = 1 11 0 0 = 256*0 + 16*1 +11= 27 psi
9: High pressure alarm value: EBAA =  4 1 0 0 = 256*0 + 16*4 +1= 65 psi 
10: Checksum for Non-Volatile Memory: CM = 2 12 = ???
11: Oil Pressure: CFAA = 37
12: Sensor Volts: EPAI = 4 15 0 8 = 256*8 + 16*4 +15= 2116=2.116 VDC
13: Checksum: KI = 10 8
14: Checksum: 37

Where A=0, B=1, C=2, ... , O=14, P=15

Decode Oil Pressure as:
CFAA = 16*C + F + 4096*A + 256*A
CFAA = 16*2 + 5 + 4096*0 + 256*0
CFAA = 37 psi

//alpha is an array map for converting sentence codes from letters to numbers
//A=0, B=1, etc


*/
  D: {
    path: 'propulsion.0.oilPressure',
    meta: {
      description: 'CruzPro OP30/OP60 Engine Oil Pressure Gauge',
      units: 'pa',
      displayName: 'Engine Oil Pressure',
      shortName: 'EOP',
      warnMethod: ['visual'],
      alarmMethod: ['sound'],
      gaugeAlarmOn: false,
      backlight: 0,
      zones: [],
      originalValue: null,
    },
  },
  /*

T30/T60 digital temperature gauge sample NMEA sentence:

Sentence: $PBVE,EDOIADOKACABABAAAACAPPCMABCGADABDOAEGL*20

Parse as:
      0 1   2    3   4  5  6  7   8    9  10  11   12  13 14
      | |   |    |   |  |  |  |   |    |  |   |    |   |  |    
$PBVE,x,x,xxxx,xxxx,xx,xx,xx,xx,xxxx,xxxx,xx,xxxx,xxxx,xx*xx
$PBVE,E D OIAD OKAC AB AB AA AA CAPP CMAB CG ADAB DOAE GL 20

0: Product Code =  E = T30/T60
1: Software Version # 
2: Temperature Calibration Number 
3: A2D gain 
4: Sender Type
5: Backlight Level
6: Units of Measure (0= deg F, non-0= deg C)
7: Built-in Alarms Armed (AA=0 = NO)
8: Low temperature alarm value
9: High temperature alarm value
10: Checksum for Non-Volatile Memory
11: Engine Temperature
12: Sensor Volts
13: NMEA sentence checksum
14: Checksum

Where A=0, B=1, C=2, ... , O=14, P=15

Decode Temperature as:
ADAB = 16*A + D + 4096*A + 256*B
ADAB = 16*0 + 3 + 4096*0 +256*1
ADAB = 0 + 3 + 0 + 256
ADAB = 259 deg F

*/
  E: {
    path: 'propulsion.0.coolantTemperature',
    meta: {
      description: 'CruzPro T30/T60 Engine Coolant Temperature Gauge',
      units: 'k',
      displayName: 'Engine Coolant Temperature',
      shortName: 'ECT',
      warnMethod: ['visual'],
      alarmMethod: ['sound'],
      gaugeAlarmOn: false,
      backlight: 0,
      zones: [],
      originalValue: null,
    },
  },
}

/*
 @function convertAlphasToInts
 @param alphas String
 @return Array
*/
function toInts(alphas) {
  let replacement = []
  let i
  alphas = alphas.split('')

  for (i = 0; i < alphas.length; i++) {
    replacement.push(alpha.indexOf(alphas[i]))
  }
  return replacement
}

/*
 @function convertToValue
 @param values String
 @return Int
*/
function convertToValue(values) {
  const parts = toInts(values)
  return 16 * parts[0] + parts[1] + 4096 * parts[2] + 256 * parts[3]
}

/*
 @function convertToAlarmValue
 @param values String
 @return Int
*/
function convertToAlarmValue(values) {
  const parts = toInts(values)
  return 16 * parts[0] + parts[1] + 256 * parts[2]
}

/*
 @function convertToEngineMinutes
 @param values String
 @return Int
*/
function convertToEngineMinutes(values) {
  const parts = toInts(values)
  return 16 * parts[0] + parts[1]
}

module.exports = function (input) {
  let convertedValue = {}
  let delta = {}

  const { id, sentence, parts, tags } = input
  const data = parts[0]
  const productCode = data.substr(0, 1)

  //just retun right away if not supported product code
  if (productCode in schema === false) {
    debug('Unsupported product code: ', productCode)
    return
  }

  if (productCode === 'B') {  
    const highRpmAlarm = convertToValue(data.substr(14,4))/60
    // Engine minutes in seconds
    const engineMinutes = convertToEngineMinutes(data.substr(28,2)) * 60 
    // Engine hours in seconds
    const engineHours = convertToValue(data.substr(30,4))*3600
    const rpm = convertToValue(data.substr(42,4))/60
    const runTime = engineHours + engineMinutes
    const gaugeAlarmOn = highRpmAlarm > rpm ? 1 : 0

    delta =  {
      updates: [{
        source: tags.source,
        timestamp: tags.timestamp,
        values: [{
          value: rpm,
          path: 'propulsion.0.revolutions',
          meta: {
            description: 'CruzPro RH30/RH60/RH110 Digital RPM',
            units:'hz',
          }
        },
        {
          value: runTime,
          path: 'propulsion.0.runTime',
          meta: {
            description: 'CruzPro RH30/RH60/RH110 Engine Hours',
            units:'s'
          }
        }]
      }]
    }  
    return delta
  } else if (productCode  === 'D' || productCode  === 'E') {   

    const backlight = data.substr(8, 2)
    const gaugeUnits = data.substr(15, 2)
    const gaugeAlarmOn = data.substr(17, 2)
    const lower = convertToAlarmValue(data.substr(18, 4))
    const upper = convertToAlarmValue(data.substr(22, 4))
    const value = convertToValue(data.substr(28, 4))

    if (productCode === 'D') {
      const conditionalValue = function (derivedValue) {
        return gaugeUnits === 'AA'
          ? derivedValue * 6894.757
          : derivedValue * 100000
      }

      convertedValue = {
        //convert to pascals from psi/bar
        value: conditionalValue(value),
        path: schema[productCode].path,
        meta: schema[productCode].meta,
      }
      convertedValue.meta.gaugeUnits = gaugeUnits === 'AA' ? 'psi' : 'bar'
      //TODO: Add warning zone values
      convertedValue.meta.zones = [
        {
          lower: conditionalValue(lower),
          state: 'alarm',
          message: 'Engine oil pressure at lowest threshold',
        },
        {
          upper: conditionalValue(upper),
          state: 'alarm',
          message: 'Engine oil pressure at highest threshold',
        },
      ]
    } else if (productCode === 'E') {
      const conditionalValue = function (derivedValue) {
        return gaugeUnits === 'AA'
          ? (derivedValue - 32) * (5 / 9) + 273.15
          : derivedValue + 273.15
      }

      convertedValue = {
        //convert to C from F
        value: conditionalValue(value),
        path: schema[productCode].path,
        meta: schema[productCode].meta,
      }
      convertedValue.meta.gaugeUnits = gaugeUnits === 'AA' ? 'f' : 'c'
      //TODO: Add warning zone values
      convertedValue.meta.zones = [
        {
          lower: conditionalValue(lower),
          state: 'alarm',
          message: 'Engine coolant temperature at lowest threshold',
        },
        {
          upper: conditionalValue(upper),
          state: 'alarm',
          message: 'Engine coolant temperature at highest threshold',
        },
      ]
    }

    //baclight is AA, AB, etc so just need second value
    convertedValue.meta.backlight = toInts(backlight)[1]
    // instrument gauge alarm is armed when second value is 1 (A,B)
    convertedValue.meta.gaugeAlarmOn = toInts(gaugeAlarmOn)[1] === 1
    //store original value in meta
    convertedValue.meta.originalValue = value

    delta = {
      updates: [
        {
          source: tags.source,
          timestamp: tags.timestamp,
          values: [convertedValue],
        },
      ],
    }

    return delta
  }
}