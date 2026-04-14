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

'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.Should()
chai.use(require('./helpers/chai-has-item'))

describe('RMC', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(
      '$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,0.58,251.34,030414,,,A*65'
    )

    delta.updates[0].timestamp.should.equal('2014-04-03T08:54:12.000Z')
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariation'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariationAgeOfService'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.datetime'
    )
    delta.updates[0].values
      .find((value) => value.path === 'navigation.position')
      .value.latitude.should.be.closeTo(52.372, 0.005)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.position')
      .value.longitude.should.be.closeTo(4.91, 0.005)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.datetime')
      .value.should.equal('2014-04-03T08:54:12.000Z')
    delta.updates[0].values
      .find((value) => value.path === 'navigation.courseOverGroundTrue')
      .value.should.be.closeTo(4.387, 0.005)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.speedOverGround')
      .value.should.be.closeTo(0.298, 0.005)
    chai
      .expect(
        delta.updates[0].values.find(
          (value) => value.path === 'navigation.magneticVariation'
        ).value
      )
      .to.be.a('null')
    delta.updates[0].values
      .find(
        (value) => value.path === 'navigation.magneticVariationAgeOfService'
      )
      .value.should.equal(1396515252)
  })

  it('Converts OK using individual parser, w/ missing SOG/COG values', () => {
    const delta = new Parser().parse(
      '$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,,,030414,12,E*42'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.magneticVariation'
    )
    chai
      .expect(
        delta.updates[0].values.find(
          (value) => value.path === 'navigation.courseOverGroundTrue'
        ).value
      )
      .to.be.a('null')
    chai
      .expect(
        delta.updates[0].values.find(
          (value) => value.path === 'navigation.speedOverGround'
        ).value
      )
      .to.be.a('null')
    delta.updates[0].values
      .find((value) => value.path === 'navigation.magneticVariation')
      .value.should.be.closeTo(0.20944, 0.05)
  })

  it('Converts OK using individual parser, w/ invalid lat/lng values', () => {
    const delta = new Parser().parse(
      // note that this particular example contains invalid latitude (1547\x0E70800) and invalid datestamp/magvar (110925\f12.49)
      '$GPRMC,210735.00,A,1547\x0E70800,S,14506.50460,W,0.187,10.33,110925\f12.49,E,A*3E'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.speedOverGround'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.datetime'
    )
    should.equal(
      delta.updates[0].values.find(
        (value) => value.path === 'navigation.position'
      ).value,
      null
    )
    delta.updates[0].values
      .find((value) => value.path === 'navigation.courseOverGroundTrue')
      .value.should.be.closeTo(0.18, 0.005)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.speedOverGround')
      .value.should.be.closeTo(0.096, 0.005)
    delta.updates[0].values
      .find((value) => value.path === 'navigation.datetime')
      .value.should.equal('2025-09-11T21:07:35.000Z')
  })
})
