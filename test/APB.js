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

chai.Should()
chai.use(require('chai-things'))

describe('APB', done => {
  it('Doesn\'t parse APB sentences', () => {
    should.Throw(() => {
      new Parser().parse('$GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*3C')
      },
      /@FIXME: APB hook needs to be rewritten to fit latest version of SK/
    )
  })

})
