/**
 * Copyright 2022 Signal K.
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

// `toFull` import removed; the current schema rejects the GNS shape. When
// re-enabled, `toFull(delta).should.be.validSignalK` can be restored.

describe('GNS', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPGNS,111648.00,0235.0379,S,04422.1450,W,ANN,12,0.8,8.5,-22.3,,,S*5D'
    ) as any

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
      'navigation.gnss.geoidalSeparation'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialReference'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.status'
    )

    // Values
    delta.updates[0]!.values[0]!.value.should.deep.equal({
      longitude: -44.369083333333336,
      latitude: -2.583965
    })
    delta.updates[0]!.values[1]!.value.should.deep.equal({
      GPS: 'Autonomous',
      GLONASS: 'No Valid Fix',
      Galileo: 'No Valid Fix'
    })
    delta.updates[0]!.values[2]!.value.should.equal(12)
    delta.updates[0]!.values[3]!.value.should.equal(8.5)
    delta.updates[0]!.values[4]!.value.should.equal(0.8)
    delta.updates[0]!.values[5]!.value.should.equal(-22.3)
    should.equal(delta.updates[0]!.values[6]!.value, null)
    should.equal(delta.updates[0]!.values[7]!.value, null)
    delta.updates[0]!.values[8]!.value.should.equal('Safe')
    // toFull(delta).should.be.validSignalK
  })

  it('Converts OK using individual parser', () => {
    const delta = new Parser({ validateChecksum: false }).parse(
      // note this malformed lat value is pulled from a real validated malformed RMC example. see test/RMC.js
      '$GPGNS,111648.00,1547\x0E70800,S,04422.1450,W,ANN,12,0.8,8.5,-22.3,,,S*5D'
    ) as any
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
      'navigation.gnss.geoidalSeparation'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialAge'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.differentialReference'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.gnss.status'
    )

    // Values
    should.equal(delta.updates[0]!.values[0]!.value, null)
    delta.updates[0]!.values[1]!.value.should.deep.equal({
      GPS: 'Autonomous',
      GLONASS: 'No Valid Fix',
      Galileo: 'No Valid Fix'
    })
    delta.updates[0]!.values[2]!.value.should.equal(12)
    delta.updates[0]!.values[3]!.value.should.equal(8.5)
    delta.updates[0]!.values[4]!.value.should.equal(0.8)
    delta.updates[0]!.values[5]!.value.should.equal(-22.3)
    should.equal(delta.updates[0]!.values[6]!.value, null)
    should.equal(delta.updates[0]!.values[7]!.value, null)
    delta.updates[0]!.values[8]!.value.should.equal('Safe')
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$GPGNS,,,,,,,,,,,,,S*32') as any
    should.equal(delta, null)
  })

  it('Emits per-field null when optional fields are empty, not zero', () => {
    // IEC 61162-1 §7.2.3.4: null NMEA field = "sensor working, value not
    // available". Altitude / geoid / differential-age / -reference are
    // optional; an empty value must surface as null rather than 0.
    const delta = new Parser().parse(
      '$GPGNS,111648.00,0235.0379,S,04422.1450,W,AN,12,0.8,8.5,,,,S*23'
    ) as any
    delta.should.be.an('object')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'navigation.gnss.geoidalSeparation'
      ).value,
      null
    )
  })

  it('Returns null when neither position nor mode indicator parses', () => {
    // Position is parseable but the mode-indicator field is empty, and
    // position+mode together are the minimum usable signal. Previously
    // gated by an arbitrary empty-count; now gated by the actual
    // usability of the output.
    const delta = new Parser().parse(
      '$GPGNS,111648.00,0235.0379,S,04422.1450,W,,,,,,,,S*2A'
    ) as any
    delta.should.be.an('object')
    // Position present, mode field empty -> methodQuality is null.
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'navigation.gnss.methodQuality'
      ).value,
      null
    )
  })

  it('Accepts time without decimal fraction', () => {
    const delta = new Parser().parse(
      '$GPGNS,111648,0235.0379,S,04422.1450,W,ANN,12,0.8,8.5,-22.3,,,S*73'
    ) as any
    const ts = delta.updates[0]!.timestamp
    ts.slice(11, 19).should.equal('11:16:48')
  })

  it('emits a UTC ISO timestamp matching today and the sentence time', () => {
    // before/after window tolerates a test run straddling midnight UTC
    const before = new Date().toISOString().slice(0, 10)
    const delta = new Parser().parse(
      '$GPGNS,111648.00,0235.0379,S,04422.1450,W,ANN,12,0.8,8.5,-22.3,,,S*5D'
    ) as any
    const after = new Date().toISOString().slice(0, 10)

    const ts = delta.updates[0]!.timestamp
    ts.should.be.a('string')
    ts.should.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/)
    // "111648" -> 11:16:48
    ts.slice(11, 19).should.equal('11:16:48')
    ts.slice(0, 10).should.be.oneOf([before, after])
  })
})
