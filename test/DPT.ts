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
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()

chai.use(chaiHasItem as any)

describe('DPT', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$IIDPT,4.1,0.0*45') as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0]!.values.should.containItemWithProperty('value', 4.1)
  })

  it('Converts OK with missing offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,*6B') as any
    delta.updates[0]!.values[0]!.path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0]!.values[0]!.value.should.equal(4.1)
  })

  it('Converts OK with positive offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,1.0*44') as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.depth.belowTransducer'
    )
    delta.updates[0]!.values.should.containItemWithProperty('value', 4.1)

    delta.updates[0]!.values[1]!.path.should.equal(
      'environment.depth.surfaceToTransducer'
    )
    delta.updates[0]!.values[1]!.value.should.equal(1)

    delta.updates[0]!.values[2]!.path.should.equal(
      'environment.depth.belowSurface'
    )
    delta.updates[0]!.values[2]!.value.should.equal(5.1)
  })

  it('Converts OK with negative offset', () => {
    const delta = new Parser().parse('$IIDPT,4.1,-1.0*69') as any

    delta.updates[0]!.values[0]!.path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(4.1, 0.1)

    delta.updates[0]!.values[1]!.path.should.equal(
      'environment.depth.transducerToKeel'
    )
    delta.updates[0]!.values[1]!.value.should.equal(1)

    delta.updates[0]!.values[2]!.path.should.equal(
      'environment.depth.belowKeel'
    )
    delta.updates[0]!.values[2]!.value.should.be.closeTo(3.1, 0.1)
  })

  it('Converts empty depth to null', () => {
    const delta = new Parser().parse('$IIDPT,,,*6C') as any
    delta.updates[0]!.values[0]!.path.should.equal(
      'environment.depth.belowTransducer'
    )
    delta.updates[0]!.values.length.should.equal(1)
    should.equal(delta.updates[0]!.values[0]!.value, null)
  })

  it('Converts empty depth to null and still outputs offset', () => {
    const delta = new Parser().parse('$IIDPT,,0.1*6F') as any
    delta.updates[0]!.values.length.should.equal(3)
    delta.updates[0]!.values[0]!.path.should.equal(
      'environment.depth.belowTransducer'
    )
    should.equal(delta.updates[0]!.values[0]!.value, null)
    delta.updates[0]!.values[1]!.path.should.equal(
      'environment.depth.surfaceToTransducer'
    )
    should.equal(delta.updates[0]!.values[1]!.value, 0.1)
    delta.updates[0]!.values[2]!.path.should.equal(
      'environment.depth.belowSurface'
    )
    should.equal(delta.updates[0]!.values[2]!.value, null)
  })

  for (const { offset, derived, offsetPath } of [
    { offset: 1, derived: 'belowSurface', offsetPath: 'surfaceToTransducer' },
    { offset: -1, derived: 'belowKeel', offsetPath: 'transducerToKeel' }
  ]) {
    it(`Clears ${derived} on bottom loss and restores it on recovery`, () => {
      const parser = new Parser()
      // Apply deltas as a client does: an omitted path retains its old value.
      const state: Record<string, unknown> = {}
      const acceptDepth = (depth: string) => {
        const body = `IIDPT,${depth},${offset}`
        const checksum = [...body]
          .reduce((sum, char) => sum ^ char.charCodeAt(0), 0)
          .toString(16)
          .toUpperCase()
          .padStart(2, '0')
        const delta = parser.parse(`$${body}*${checksum}`) as any
        for (const { path, value } of delta.updates[0].values) {
          state[path] = value
        }
      }

      acceptDepth('4')
      should.equal(state[`environment.depth.${derived}`], 4 + offset)
      acceptDepth('')
      should.equal(state['environment.depth.belowTransducer'], null)
      should.equal(state[`environment.depth.${derived}`], null)
      should.equal(state[`environment.depth.${offsetPath}`], Math.abs(offset))
      acceptDepth('6')
      should.equal(state[`environment.depth.${derived}`], 6 + offset)
      // A measured zero is valid, rather than a missing reading.
      acceptDepth('0')
      should.equal(state['environment.depth.belowTransducer'], 0)
      should.equal(state[`environment.depth.${derived}`], offset)
    })
  }
})
