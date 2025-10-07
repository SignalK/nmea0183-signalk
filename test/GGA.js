'use strict'

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

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))
chai.use(require('@signalk/signalk-schema').chaiModule)

const toFull = require('./toFull')

describe('GGA', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPGGA,172814.0,3723.46587704,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    )

    should.not.exist(delta.updates[0].source.label)
    delta.updates[0].source.talker.should.equal('GP')
    // Paths
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.position'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.methodQuality'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.satellites'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.antennaAltitude'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.horizontalDilution'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.differentialReference'
    )
    // Values
    delta.updates[0].values
      .find((value) => value.path === 'navigation.position')
      .value.should.deep.equal({
        longitude: -122.03782631066667,
        latitude: 37.39109795066667,
      })
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.methodQuality')
      .value.should.equal('DGNSS fix')
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.satellites')
      .value.should.equal(6)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.antennaAltitude')
      .value.should.equal(18.893)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.horizontalDilution')
      .value.should.equal(1.2)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.geoidalSeparation')
      .value.should.equal(-25.669)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.differentialAge')
      .value.should.equal(2.0)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.differentialReference')
      .value.should.equal(31)

    toFull(delta).should.be.validSignalK
  })

  it('Converts OK using individual parser with invalid lat/lng', () => {
    const delta = new Parser({ validateChecksum: false }).parse(
      // note this malformed lat value is pulled from a real validated malformed RMC example. see test/RMC.js
      '$GPGGA,172814.0,1547\x0E70800,N,12202.26957864,W,2,6,1.2,18.893,M,-25.669,M,2.0,0031*4F'
    )

    should.not.exist(delta.updates[0].source.label)
    delta.updates[0].source.talker.should.equal('GP')
    // Paths
    delta.updates[0].values.should.not.contain.an.item.with.property(
      'path',
      'navigation.position'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.methodQuality'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.satellites'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.antennaAltitude'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.horizontalDilution'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.gnss.differentialReference'
    )
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.methodQuality')
      .value.should.equal('DGNSS fix')
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.satellites')
      .value.should.equal(6)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.antennaAltitude')
      .value.should.equal(18.893)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.horizontalDilution')
      .value.should.equal(1.2)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.geoidalSeparation')
      .value.should.equal(-25.669)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.differentialAge')
      .value.should.equal(2.0)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.gnss.differentialReference')
      .value.should.equal(31)
    toFull(delta).should.be.validSignalK
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$GPGGA,,,,,,,,,,,,,,*56')
    should.equal(delta, null)
  })
})
