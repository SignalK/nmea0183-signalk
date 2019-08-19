/**
 * Copyright 2019 Signal K <info@signalk.org> and contributors.
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

const Parser = require('../lib')
const should = require('chai').Should()
const toFull = require('./toFull')

describe('PBVE', () => {
  
  it('Converts engine oil pressure using individual parser', () => {
    const delta = new Parser().parse('$PBVE,DGOIADNNACAEACAAABBLAAEBAACMCFAAEPAIKI*37')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.0.oilPressure')
    delta.updates[0].values[0].value.should.equal(255106.009)
    delta.updates[0].values[0].meta.should.deep.equal(
      {
        description: 'CruzPro OP30/OP60 Engine Oil Pressure Gauge',
        units: 'pa',
        displayName: 'Engine Oil Pressure',
        shortName: 'EOP',
        warnMethod: [ 'visual' ],
        alarmMethod: [ 'sound' ],
        gaugeAlarmOn: true,
        backlight: 2,
        originalValue: 37,
        gaugeUnits: 'psi',
        zones: [
          {
            lower: 186158.43899999998,
            state: 'alarm',
            message: 'Engine oil pressure at lowest threshold'
          },
          {
            upper: 448159.20499999996,
            state: 'alarm',
            message: 'Engine oil pressure at highest threshold'
          } 
        ]
      } 
    )

    toFull(delta).should.be.validSignalK
  })
  it('Converts engine coolant temperature using individual parser', () => {
    const delta = new Parser().parse('$PBVE,EDOIADOKACABABAAAACAPPCMABCGADABDOAEGL*20')
    delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.0.coolantTemperature')
    delta.updates[0].values[0].value.should.equal(399.26111111111106)
    delta.updates[0].values[0].meta.should.deep.equal(
      {
        description: 'CruzPro T30/T60 Engine Coolant Temperature Gauge',
        units: 'k',
        displayName: 'Engine Coolant Temperature',
        shortName: 'ECT',
        warnMethod: ['visual'],
        alarmMethod: ['sound'],
        gaugeAlarmOn: false,
        backlight: 2,
        originalValue: 259,
        gaugeUnits: 'f',
        zones: [
          {
            lower: 2406.4833333333336,
            state: 'alarm',
            message: 'Engine coolant temperature at lowest threshold'
          },
          {
            upper: 279.81666666666666,
            state: 'alarm',
            message: 'Engine coolant temperature at highest threshold' 
          } 
        ]
      } 
    )

    toFull(delta).should.be.validSignalK
  })

  it('Should not parse if product code is F, B, or A', () => {
    should.not.exist(new Parser().parse('$PBVE,FGLABCGJAAAHADEE*21'))
    should.not.exist(new Parser().parse('$PBVE,BEAAADAAABFKBCIIBDAGOOABAAAAADAAAAOIACAAONFMAKCAADAAAAHG*2A'))
    should.not.exist(new Parser().parse('$PBVE,AQHKAAAACIAAAAABAAGEDOBCAAAAFLABCKAADIAADIAAAAAANDEN*3F'))
  })

})
