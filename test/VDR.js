'use strict'

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

const Parser = require('../lib')
const chai = require('chai')
const nmeaLine = '$IIVDR,10.1,T,12.3,M,1.2,N*3A'

chai.Should()
chai.use(require('chai-things'))
chai.use(require('@signalk/signalk-schema').chaiModule)
const toFull = require('./toFull')


describe('VDR', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.current')
      delta.updates[0].values[0].value.should.deep.equal({
        setTrue: 0.1762782544916768,
        setMagnetic: 0.21467549804431932,
        drift: 0.6173334897244841
      })
      toFull(delta).should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })

})
