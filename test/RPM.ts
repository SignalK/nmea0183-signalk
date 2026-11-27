/**
 * Copyright 2016 Signal K <info@signalk.org> and contributors.
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
chai.Should()
chai.use(chaiHasItem as any)

const nmeaLine = '$IIRPM,E,1,2418.2,10.5,A*5F'

describe('RPM', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse(nmeaLine) as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'propulsion.engine_1.revolutions'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(2418.2 / 60, 0.0005)
  })

  it("Source 'S' maps to propulsion.shaft_<id>", () => {
    const delta = new Parser().parse('$IIRPM,S,2,1800.0,0.0,A*7A') as any
    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'propulsion.shaft_2.revolutions'
    )
    delta.updates[0]!.values[0]!.value.should.be.closeTo(30, 0.0005)
  })

  /* FIXME!
  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIRPM,,,,,*63') as any
    should.equal(delta, null)
  })
  */
})

function rpmSentence(
  source: string,
  number: number,
  rpm: string,
  status: string
) {
  const body = `IIRPM,${source},${number},${rpm},0.0,${status}`
  const checksum = Array.from(body).reduce(
    (value, character) => value ^ character.charCodeAt(0),
    0
  )
  return `$${body}*${checksum.toString(16).toUpperCase().padStart(2, '0')}`
}

describe('RPM invalid readings (#56)', () => {
  for (const [source, kind] of [
    ['E', 'engine'],
    ['S', 'shaft']
  ]) {
    it(`clears and restores ${kind} speed without affecting another ${kind}`, () => {
      const parser = new Parser()
      const state: Record<string, unknown> = {}
      const apply = (number: number, speed: string, status: string) => {
        const delta = parser.parse(rpmSentence(source!, number, speed, status))!
        for (const update of delta.updates!) {
          if ('values' in update) {
            for (const item of update.values!) state[item.path] = item.value
          }
        }
      }
      const path = `propulsion.${kind}_1.revolutions`
      const other = `propulsion.${kind}_2.revolutions`
      apply(1, '1800', 'A')
      apply(2, '1200', 'A')
      chai.expect(state[path]).to.equal(30)
      for (const speed of ['1800', '0', '-1200', '']) {
        apply(1, speed, 'V')
        chai.expect(state[path], `invalid ${speed}`).to.equal(null)
        chai.expect(state[other]).to.equal(20)
      }
      apply(1, '2400', 'A')
      chai.expect(state[path]).to.equal(40)
      apply(1, '0', 'A')
      chai.expect(state[path]).to.equal(0)
      apply(1, '-600', 'A')
      chai.expect(state[path]).to.equal(-10)
      apply(1, '', 'A')
      chai.expect(state[path]).to.equal(null)
    })
  }

  it('preserves legacy readings with an empty status field', () => {
    const delta = new Parser().parse(rpmSentence('E', 0, '1800', '')) as any
    chai.expect(delta.updates[0].values[0].value).to.equal(30)
  })

  it('recognizes a lower-case invalid status', () => {
    const delta = new Parser().parse(rpmSentence('E', 0, '1800', 'v')) as any
    chai.expect(delta.updates[0].values[0].value).to.equal(null)
  })
})
