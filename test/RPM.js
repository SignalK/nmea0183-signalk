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
const nmeaLine = '$IIRPM,E,1,2418.2,10.5,A*5F'

chai.Should()
chai.use(require('chai-things'))

describe('RPM', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.engine_1.revolutions')
      delta.updates[0].values[0].value.should.be.closeTo(((2418.2 / 60)), 0.0005)
      done()
    })

    parser.parse(nmeaLine)
  })

  /*
  it('Doesn\'t choke on empty sentences', done => {
    const parser = new Parser
    parser
    .parse('$IIRPM,,,,,*63')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })
  */

})
