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

import Parser from '../src/lib'
import * as chai from 'chai'
import pkg from '../package.json'
chai.Should()

describe('Package info', () => {
  it(`Retrieves name "${pkg.name}" successfully`, (done) => {
    const data = new Parser().name
    data.should.equal(pkg.name)
    done()
  })

  it(`Retrieves license "${pkg.license}" successfully`, (done) => {
    const data = new Parser().license
    data.should.equal(pkg.license)
    done()
  })

  it(`Retrieves version "${pkg.version}" successfully`, (done) => {
    const data = new Parser().version
    data.should.equal(pkg.version)
    done()
  })

  it(`Retrieves author "${pkg.author}" successfully`, (done) => {
    const data = new Parser().author
    data.should.equal(pkg.author)
    done()
  })

  it('Tolerates a non-object options argument', () => {
    const parser = new Parser('not-an-object')
    parser.options.validateChecksum!.should.equal(true)
  })

  it('Throws a TypeError when the options argument is null', () => {
    ;(() => new Parser(null)).should.throw(TypeError, /must not be null/)
  })
})
