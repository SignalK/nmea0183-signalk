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

chai.Should()
chai.use(require('chai-things'))

describe('RMC', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].timestamp.should.equal('2014-04-03T08:54:00.000Z')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseOverGroundTrue')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedOverGround')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariation')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariationAgeOfService')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.datetime')
      delta.updates[0].values[0].value.latitude.should.be.closeTo(52.372, 0.005)
      delta.updates[0].values[0].value.longitude.should.be.closeTo(4.91, 0.005)
      delta.updates[0].values[5].value.should.equal('2014-04-03T08:54:00.000Z')
      delta.updates[0].values[1].value.should.be.closeTo(4.387, 0.005)
      delta.updates[0].values[2].value.should.be.closeTo(0.298, 0.005)
      delta.updates[0].values[3].value.should.equal(0)
      delta.updates[0].values[4].value.should.equal(1396515240)
      done()
    })

    parser.parse('$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,0.58,251.34,030414,,,A*65').catch(e => done(e))
  })

})
