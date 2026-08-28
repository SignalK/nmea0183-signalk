/**
 * Verifies that the example plugin shipped in `custom-sentence-plugin/` still
 * registers a working parser. The README points readers at that plugin, so it
 * has to keep parsing the sentence its own instructions tell people to send.
 */

import Parser from '../src/lib'
import type { CustomSentenceParserEntry, ParserOptions } from '../src/types'
import * as chai from 'chai'
chai.Should()

const makeExamplePlugin = require('../custom-sentence-plugin') as (app: {
  emitPropertyValue: (name: string, value: unknown) => void
}) => { start: () => void }

describe('custom-sentence-plugin example', () => {
  it('parses the XXX sentence from its own test instructions', () => {
    const emitted: Array<{ name: string; value: unknown }> = []
    const plugin = makeExamplePlugin({
      emitPropertyValue: (name, value) => emitted.push({ name, value })
    })
    plugin.start()

    emitted.should.have.lengthOf(1)
    emitted[0]!.name.should.equal('nmea0183sentenceParser')
    ;(emitted[0]!.value as CustomSentenceParserEntry).sentence.should.equal(
      'XXX'
    )

    const options: ParserOptions = {
      onPropertyValues: (_name, cb) =>
        cb(emitted.map(({ value }) => ({ value })))
    }
    const parser = new Parser(options)

    const delta = parser.parse('$IIXXX,1,2,3,foobar,D*17')

    delta!.should.deep.equal({
      updates: [
        {
          source: { sentence: 'XXX', talker: 'II', type: 'NMEA0183' },
          values: [{ path: 'navigation.speedOverGround', value: 1 }]
        }
      ]
    })
  })
})
