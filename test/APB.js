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
const should = require('chai').Should()

const heading = '$STALK,84,B6,10,00,00,00,00,00,00*14'
const standby = '$STALK,84,E6,15,00,00,00,00,00,08*1E'
const auto = '$STALK,84,56,5E,79,02,00,00,00,08*16'
const wind = '$STALK,84,06,00,00,04,00,00,00,00*63'
const route = '$STALK,84,06,00,00,08,00,00,00,00*6F'
const rudder = '$STALK,84,06,00,00,08,00,FE,00,00*6C'
const heading_nineC = '$STALK,9C,51,1E,00*4B'

chai.Should()
chai.use(require('chai-things'))

describe('APB', done => {
  it('Doesn\'t parse APB sentences', done => {
    new Parser()
    .parse('$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => {
      should.equal(e.message, "@FIXME: APB hook needs to be rewritten to fit latest version of SK")
      done()
    })
  })

})
