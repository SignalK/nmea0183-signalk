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

describe('VTG', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseOverGroundMagnetic')
      delta.updates[0].values[0].value.should.be.closeTo(6.271, 0.005)

      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.courseOverGroundTrue')
      delta.updates[0].values[1].value.should.equal(0)

      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.speedOverGround')
      delta.updates[0].values[2].value.should.equal(0)
      done()
    })

    parser.parse('$GPVTG,0.0,T,359.3,M,0.0,N,0.0,K,A*2F').catch(e => done(e))
  })

})
