/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
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

describe('HDG', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingMagnetic')
      delta.updates[0].values[0].value.should.be.closeTo((181.9 / 180 * Math.PI), 0.005)
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.magneticVariation')
      delta.updates[0].values[1].value.should.be.closeTo((0.6 / 180 * Math.PI), 0.005)
      done()
    })

    parser.parse('$SDHDG,181.9,,,0.6,E*32').catch(e => done(e))
  })

  it('Doesn\'t choke on empty sentences', done => {
    new Parser()
    .parse('$SDHDG,,,,,*70')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })

})
