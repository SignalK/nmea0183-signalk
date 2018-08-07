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
const signalkSchema = require('@signalk/signalk-schema')

chai.use(require('chai-things'))

describe('VLW', () => {
  it('total cumulative distance', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.log')
      delta.updates[0].values[0].value.should.be.equal(10.1)
      done()
    })

    parser.parse('$IIVLW,10.1,N,3.2,N*7C')
  })

  it('trip distance', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.trip.log')
      delta.updates[0].values[1].value.should.be.equal(12.3)
      done()
    })

    parser.parse('$IIVLW,115.2,N,12.3,N*7A')
  })
})
