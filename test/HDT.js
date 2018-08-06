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

describe('HDT', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser()

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.headingTrue')
      delta.updates[0].values[0].value.should.be.closeTo(2.155, 0.005)
      done()
    })

    parser.parse('$GPHDT,123.456,T*32')
  })

  it('Doesn\'t choke on empty sentences', () => {
    const result = new Parser().parseImmediate('$SKHDT,,*40')
    should.equal(result, null)
  })

})
