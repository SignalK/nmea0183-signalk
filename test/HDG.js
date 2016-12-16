/**
 * Copyright 2016 Signal K and Joachim Bakke.
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
const nmeaLine = '$SDHDG,181.9,,,0.6,E*32'

chai.Should()
chai.use(require('chai-things'))

describe('HDG', () => {

  it('Converts OK using individual parser', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.have.all.keys({'path': 'navigation.headingMagnetic', 'value': (181.9 / 180 * Math.PI)})
      delta.updates[0].values.should.have.all.keys({'path': 'navigation.magneticVariation', 'value': (0.6 / 180 * Math.PI)})

      done()
    })

    parser.parse(nmeaLine)
  })

  it('Converts OK using stream parser', done => {
    const parser = new Parser
    const stream = parser.stream()

    stream.on('data', result => {
      result.should.be.an.object
      result.should.have.property('delta')
      result.delta.updates[0].values.should.have.all.keys({'path': 'navigation.headingMagnetic', 'value': (181.9 / 180 * Math.PI)})
      result.delta.updates[0].values.should.have.all.keys({'path': 'navigation.magneticVariation', 'value': (0.6 / 180 * Math.PI)})
      done()
    })

    stream.write(nmeaLine)
  })

})
