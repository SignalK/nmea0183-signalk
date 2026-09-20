/**
 * Copyright 2016 Signal K and contributors.
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
import chaiHasItem from './helpers/chai-has-item'
import withClock from './helpers/with-clock'
const should = chai.Should()

chai.Should()
chai.use(chaiHasItem as any)

describe('RMC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,0.58,251.34,030414,,,A*65'
    ) as any

    delta.updates[0]!.timestamp.should.equal('2014-04-03T08:54:12.000Z')
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariation'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariationAgeOfService'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.datetime'
    )
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.position'
    )!.value.latitude.should.be.closeTo(52.372, 0.005)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.position'
    )!.value.longitude.should.be.closeTo(4.91, 0.005)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.datetime'
    )!.value.should.equal('2014-04-03T08:54:12.000Z')
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.courseOverGroundTrue'
    )!.value.should.be.closeTo(4.387, 0.005)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.speedOverGround'
    )!.value.should.be.closeTo(0.298, 0.005)
    chai
      .expect(
        delta.updates[0]!.values.find(
          (value: any) => value.path === 'navigation.magneticVariation'
        ).value
      )
      .to.be.a('null')
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.magneticVariationAgeOfService'
    )!.value.should.equal(1396515252)
  })

  it('Converts OK using individual parser, w/ missing SOG/COG values', () => {
    const delta = new Parser().parse(
      '$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,,,030414,12,E*42'
    ) as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariation'
    )
    chai
      .expect(
        delta.updates[0]!.values.find(
          (value: any) => value.path === 'navigation.courseOverGroundTrue'
        ).value
      )
      .to.be.a('null')
    chai
      .expect(
        delta.updates[0]!.values.find(
          (value: any) => value.path === 'navigation.speedOverGround'
        ).value
      )
      .to.be.a('null')
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.magneticVariation'
    )!.value.should.be.closeTo(0.20944, 0.05)
  })

  it('Emits null position when longitude direction is invalid', () => {
    const delta = new Parser().parse(
      '$GPRMC,085412.000,A,5222.3198,N,00454.5784,Q,0.58,251.34,030414,,,A*71'
    ) as any
    should.equal(
      delta.updates[0]!.values.find(
        (v: any) => v.path === 'navigation.position'
      )!.value,
      null
    )
  })

  it('Converts OK using individual parser, w/ invalid lat/lng values', () => {
    const delta = new Parser().parse(
      // note that this particular example contains invalid latitude (1547\x0E70800) and invalid datestamp/magvar (110925\f12.49)
      '$GPRMC,210735.00,A,1547\x0E70800,S,14506.50460,W,0.187,10.33,110925\f12.49,E,A*3E'
    ) as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'navigation.datetime'
    )
    should.equal(
      delta.updates[0]!.values.find(
        (value: any) => value.path === 'navigation.position'
      ).value,
      null
    )
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.courseOverGroundTrue'
    )!.value.should.be.closeTo(0.18, 0.005)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.speedOverGround'
    )!.value.should.be.closeTo(0.096, 0.005)
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.datetime'
    )!.value.should.equal('2025-09-11T21:07:35.000Z')
  })

  it('dates navigation.datetime like the timestamp when the date field is empty', () => {
    // Receivers can send RMC before they know the date. A 23:59:59 fix
    // received just after UTC midnight belongs to the previous day.
    const delta = withClock('2026-09-12T00:00:00.691Z', () =>
      new Parser().parse(
        '$GNRMC,235959.000,A,3819.16721,N,02133.08984,E,0.0,0.0,,,,A*7F'
      )
    ) as any
    delta.updates[0]!.values.find(
      (value: any) => value.path === 'navigation.datetime'
    )!.value.should.equal('2026-09-11T23:59:59.000Z')
  })

  it('withholds the fix of a void sentence but keeps its datetime', () => {
    // Status V is a navigation receiver warning. The fields still carry
    // whatever the receiver last held, so they are reported as unavailable
    // rather than as a live fix.
    const delta = new Parser().parse(
      '$GPRMC,123519,V,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*7D'
    ) as any
    const value = (path: string) =>
      delta.updates[0]!.values.find((v: any) => v.path === path)!.value

    should.equal(value('navigation.position'), null)
    should.equal(value('navigation.courseOverGroundTrue'), null)
    should.equal(value('navigation.speedOverGround'), null)
    should.equal(value('navigation.magneticVariation'), null)
    // A receiver that has lost its fix normally still keeps good time.
    value('navigation.datetime').should.equal('1994-03-23T12:35:19.000Z')
  })

  it('uses the tag block time when both time and date are empty', () => {
    // Replayed log with a void RMC: c:1748822400 -> 2025-06-02T00:00:00Z
    const delta = new Parser().parse(
      '\\s:logger,c:1748822400*2E\\$GPRMC,,V,,,,,,,,,,N*53'
    ) as any
    delta.updates[0]!.timestamp.should.equal('2025-06-02T00:00:00.000Z')
  })

  it('uses the host clock when time, date and tag block time are all missing', () => {
    // Live void RMC without any time information.
    const delta = withClock('2026-09-12T10:00:00.000Z', () =>
      new Parser().parse('$GPRMC,,V,,,,,,,,,,N*53')
    ) as any
    delta.updates[0]!.timestamp.should.equal('2026-09-12T10:00:00.000Z')
  })
})
