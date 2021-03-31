/**
 * Copyright 2021 Signal K and Teppo Kurki <teppo.kurki@iki.fi>
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
const { expect } = require('chai')
const should = chai.Should()
chai.use(require('chai-things'))


describe('Custom Sentence Parser', () => {
  it('works', () => {
    const TEST_SENTENCE_PARTS = ['1', '2', '3', 'foobar', 'D']
    const TEST_CUSTOM_SENTENCE = `$IIXXX,${TEST_SENTENCE_PARTS.join(',')}*17`
    const DELTA = {
      updates: [
        {
          values: [
            { path: 'a.b.c', value: 3.14 }
          ]
        }
      ]
    }
    let onPropValuesCallCount = 0
    const options = {
      onPropertyValues: (propertyName, cb) => {
        onPropValuesCallCount++
        cb(undefined)
        cb([{
          value: {
            sentence: 'XXX',
            parser: ({ id, sentence, parts, tags }, session) => {
              id.should.equal('XXX')
              sentence.should.equal(TEST_CUSTOM_SENTENCE)
              parts.should.have.members(TEST_SENTENCE_PARTS)
              expect(typeof session).to.equal('object')
              return DELTA
            }
          }
        }])
      }
    }
    const parser = new Parser(options)
    onPropValuesCallCount.should.equal(1)
    const delta = parser.parse(TEST_CUSTOM_SENTENCE)
    delta.should.deep.equal(DELTA)
  })
})
