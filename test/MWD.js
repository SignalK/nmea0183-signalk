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
const should = chai.Should()

chai.use(require('chai-things'))

describe('MWD', () => {
  it('speed & direction data (#1)', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,M,10.1,N,05.2,M*0B')

    delta.updates[0].values[0].path.should.equal(
      'environment.wind.directionMagnetic'
    )
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[1].path.should.equal('environment.wind.speedTrue')
    delta.updates[0].values[1].value.should.equal(5.2)
  })

  it('speed & direction data (#2)', () => {
    const delta = new Parser().parse('$IIMWD,046.,T,046.,M,10.1,N,,*17')

    delta.updates[0].values[0].path.should.equal(
      'environment.wind.directionTrue'
    )
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[1].path.should.equal(
      'environment.wind.directionMagnetic'
    )
    delta.updates[0].values[1].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[2].path.should.equal('environment.wind.speedTrue')
    delta.updates[0].values[2].value.should.be.closeTo(5.2, 0.005)
  })

  it('speed & direction data (#3)', () => {
    const delta = new Parser().parse('$IIMWD,046.,T,,,,,5.2,M*72')

    delta.updates[0].values[0].path.should.equal(
      'environment.wind.directionTrue'
    )
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[1].path.should.equal('environment.wind.speedTrue')
    delta.updates[0].values[1].value.should.be.equal(5.2)
  })

  it('missing direction data', () => {
    const delta = new Parser().parse('$IIMWD,,,,,,,5.2,M*3A')

    should.equal(delta, null)
  })

  it('missing speed data', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,M,,,,*0F')

    should.equal(delta, null)
  })

  it('improper direction designator (#1)', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,T,,,,*16')

    should.equal(delta, null)
  })

  it('improper direction designator (#2)', () => {
    const delta = new Parser().parse('$IIMWD,046.,M,,,,,,*0F')

    should.equal(delta, null)
  })

  it('improper speed designator (#1)', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,M,10.1,n,,*7F')

    should.equal(delta, null)
  })

  it('improper speed designator (#2)', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,M,,,0.0,m*4C')

    should.equal(delta, null)
  })

  it('improper direction designator for degrees magnetic, using degrees true', () => {
    const delta = new Parser().parse('$IIMWD,046.,T,0.,m,10.1,N,5.2,M*51')

    delta.updates[0].values[0].path.should.equal(
      'environment.wind.directionTrue'
    )
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[1].path.should.equal('environment.wind.speedTrue')
    delta.updates[0].values[1].value.should.equal(5.2)
  })

  it('improper speed designator for m/s, using speed in kn', () => {
    const delta = new Parser().parse('$IIMWD,,,046.,M,10.1,N,0.0,m*1C')

    delta.updates[0].values[0].path.should.equal(
      'environment.wind.directionMagnetic'
    )
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
    delta.updates[0].values[1].path.should.equal('environment.wind.speedTrue')
    delta.updates[0].values[1].value.should.be.closeTo(5.2, 0.005)
  })
})
