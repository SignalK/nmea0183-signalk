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

  it('speed & direction data', () => {
      const delta = new Parser().parse('$IIMWD,,,046.,M,10.1,N,05.2,M*0B')

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedTrue')
    delta.updates[0].values[1].value.should.be.closeTo(5.19585, 0.00005)
    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.directionMagnetic')
    delta.updates[0].values[0].value.should.be.closeTo(0.802851, 0.00005)
  })

})
