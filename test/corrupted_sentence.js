'use strict'

/**
 * Copyright 2017 Signal K and Fabian Tollenaar <fabian@signalk.org>.
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

const valid = '$GPRMC,205738,A,5925.5776,N,01038.4403,E,0.0,338.6,090615,1.0,E,D*10'
const invalid = '$GPRMC,205738,A,5925.5776,N,01838.4403,E,0.0,33<.6,<90615,1.0,E,D*10'

describe('Corrupted sentence', () => {

  it('Corrupted sentence emits warning', done => {
    const parser = new Parser

    parser.on('warning', warning => {
      done()
    })

    parser.parse(invalid).catch(e => {})
  })

  it('Uncorrupted sentence converts OK', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseOverGroundTrue')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedOverGround')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariation')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariationAgeOfService')
      done()
    })

    parser.parse(valid).catch(e => done(e))
  })

})
