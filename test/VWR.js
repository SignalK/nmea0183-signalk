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
const nmeaLine = '$PIVWR,75,R,1.0,N,0.51,M,1.85,K*75'

chai.Should()
chai.use(require('chai-things'))

describe('VWR', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
      delta.updates[0].values.should.contain.an.item.with.property('value', 1.30899693929463)
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedApparent')
      delta.updates[0].values.should.contain.an.item.with.property('value', 0.5144445747704034)


      done()
    })

    parser.parse(nmeaLine)
  })

  it('Doesn\'t choke on empty sentences', done => {
    new Parser()
    .parse('$PIVWR,,,,,,,,*4A')
    .then(result => {
      chai.assert.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })

})
