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
const nmeaLine = '$GPROT,35.6,A*FF'

const should = chai.Should()
chai.use(require('chai-things'))

describe('Invalid checksum', () => {
  it('Converts OK using individual parser', () => {
    const parser = new Parser()

    parser.on('signalk:delta', delta => {
      should.fail(delta, null, 'Parser emitted a delta despite an invalid checksum')
    });

    (() => { parser.parse(nmeaLine)}).should.throw(/is invalid/)
  })

})
