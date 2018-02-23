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
const nmeaLine = '\\s:compass,c:1438489697*13\\$IIDBT,035.53,f,010.83,M,005.85,F*23'

chai.Should()
chai.use(require('chai-things'))

describe('NMEA0183v4 tag block', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].source.should.be.an('object')
      delta.updates[0].source.talker.should.equal('compass')
      delta.updates[0].timestamp.should.equal('2015-08-02T04:28:17.000Z')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.depth.belowTransducer')
      done()
    })

    parser.parse(nmeaLine)
  })

})
