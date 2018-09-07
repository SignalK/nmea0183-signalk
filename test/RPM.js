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

const nmeaLine = '$IIRPM,E,1,2418.2,10.5,A*5F'

describe('RPM', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine)

    delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.engine_1.revolutions')
    delta.updates[0].values[0].value.should.be.closeTo(((2418.2 / 60)), 0.0005)
  })

  /* FIXME!
  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIRPM,,,,,*63')
    should.equal(delta, null)
  })
  */
})
