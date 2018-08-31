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
const should = chai.Should()
chai.use(require('chai-things'))

const nmeaLineInvalidChecksum = '$GPROT,35.6,A*FF'
const nmeaLineWithoutChecksum = '$GPROT,35.6,A*'

describe('Invalid checksum', () => {
  it('by default throws exception on invalid checksum', () => {
    should.Throw(() => { new Parser().parse(nmeaLineInvalidChecksum) },
      /is invalid/)
  })

  it('by default throws exception on line without a checksum', () => {
    should.Throw(() => { new Parser().parse(nmeaLineWithoutChecksum) },
      /is invalid/)
  })

  it('with option requireChecksum==false, do not throw on missing checkum', () => {
    should.not.Throw(() => { new Parser({ requireChecksum: false }).parse(nmeaLineWithoutChecksum) },
      /is invalid/)
  })

  it('with options requireChecksum==false, should still throw on invalid checkum', () => {
    should.Throw(() => { new Parser({ requireChecksum: false }).parse(nmeaLineInvalidChecksum) },
      /is invalid/)
  })

  it('with option validateChecksum==false, do not throw on invalid checkum', () => {
    should.not.Throw(() => { new Parser({ validateChecksum: false }).parse(nmeaLineInvalidChecksum) },
      /is invalid/)
  })

  it('with option validateChecksum==false, do not throw on missing checkum', () => {
    should.not.Throw(() => { new Parser({ validateChecksum: false }).parse(nmeaLineWithoutChecksum) },
      /is invalid/)
  })
})
