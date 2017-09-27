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

describe('GLL', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values[0].path.should.equal('navigation.position')
      delta.updates[0].values[0].value.latitude.should.be.closeTo(59.9768833, 0.000005)
      delta.updates[0].values[0].value.longitude.should.be.closeTo(23.432133, 0.000005)
      // delta.should.be.validSignalKDelta
      done()
    })

    parser.parse('$GPGLL,5958.613,N,02325.928,E,121022,A,D*40').catch(e => done(e))
  })

  it('Doesn\'t choke on empty sentences', done => {
    const parser = new Parser
    parser
    .parse('$GPGLL,,,,,,,*7C')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })

})
