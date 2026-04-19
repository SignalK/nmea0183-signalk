/**
 * Copyright 2016 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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

import Parser from '../src/lib'
import * as chai from 'chai'
import * as signalkSchema from '@signalk/signalk-schema'
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()

chai.use(chaiHasItem as any)
chai.use(signalkSchema.chaiModule as any)

import toFull from './toFull'

describe('GGA', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    ) as any

    should.not.exist(delta.updates[0]!.source.label)
    delta.updates[0]!.source.talker.should.equal('GP')
    // Paths
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.methodQuality'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.satellites'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.antennaAltitude'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.horizontalDilution'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialReference'
    )
    // Values
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.position'
    )!.value.should.deep.equal({
      longitude: -122.03782631066667,
      latitude: 37.39109795066667
    })
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.methodQuality'
    )!.value.should.equal('DGNSS fix')
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.satellites'
    )!.value.should.equal(6)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.antennaAltitude'
    )!.value.should.equal(18.893)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.horizontalDilution'
    )!.value.should.equal(1.2)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.geoidalSeparation'
    )!.value.should.equal(-25.669)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.differentialAge'
    )!.value.should.equal(2.0)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.differentialReference'
    )!.value.should.equal(31)

    toFull(delta).should.be.validSignalK
  })

  it('Converts OK using individual parser with invalid lat/lng', () => {
    const delta = new Parser({ validateChecksum: false }).parse(
      // note this malformed lat value is pulled from a real validated malformed RMC example. see test/RMC.js
      '$GPGGA,172814.0,1547\x0E70800,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    ) as any

    should.not.exist(delta.updates[0]!.source.label)
    delta.updates[0]!.source.talker.should.equal('GP')
    // Paths
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.methodQuality'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.satellites'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.antennaAltitude'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.horizontalDilution'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialReference'
    )
    should.equal(
      delta.updates[0]!.values.find(
        (value: any) => value.path === 'navigation.position'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.methodQuality'
    )!.value.should.equal('DGNSS fix')
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.satellites'
    )!.value.should.equal(6)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.antennaAltitude'
    )!.value.should.equal(18.893)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.horizontalDilution'
    )!.value.should.equal(1.2)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.geoidalSeparation'
    )!.value.should.equal(-25.669)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.differentialAge'
    )!.value.should.equal(2.0)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.gnss.differentialReference'
    )!.value.should.equal(31)
    // toFull(delta).should.be.validSignalK
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$GPGGA,,,,,,,,,,,,,,*56') as any
    should.equal(delta, null)
  })

  it('Returns null once 5 or more fields are empty (guard boundary)', () => {
    // Guard is `empty > 4`; 6 empty fields must short-circuit to null.
    const delta = new Parser().parse(
      '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,,,,,,*49'
    ) as any
    should.equal(delta, null)
  })

  it('Accepts time without decimal fraction', () => {
    const delta = new Parser().parse(
      '$IIGGA,172814,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*46'
    ) as any
    const ts = delta.updates[0]!.timestamp
    ts.slice(11, 19).should.equal('17:28:14')
  })

  it('emits a UTC ISO timestamp matching today and the sentence time', () => {
    // before/after window tolerates a test run straddling midnight UTC
    const before = new Date().toISOString().slice(0, 10)
    const delta = new Parser().parse(
      '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    ) as any
    const after = new Date().toISOString().slice(0, 10)

    const ts = delta.updates[0]!.timestamp
    ts.should.be.a('string')
    ts.should.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/)
    // "172814" -> 17:28:14
    ts.slice(11, 19).should.equal('17:28:14')
    ts.slice(0, 10).should.be.oneOf([before, after])
  })
})
