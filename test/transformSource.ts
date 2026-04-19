import * as chai from 'chai'
chai.Should()
import transformSource from '../src/lib/transformSource'

describe('transformSource', () => {
  it('returns data unchanged when it is not an object', () => {
    ;(transformSource(undefined, 'RMC', 'GP') === undefined).should.equal(true)
    ;(transformSource(42, 'RMC', 'GP') === 42).should.equal(true)
    ;(transformSource('literal', 'RMC', 'GP') === 'literal').should.equal(true)
  })

  it('returns data unchanged when it is null', () => {
    ;(transformSource(null, 'RMC', 'GP') === null).should.equal(true)
  })

  it('returns data unchanged when updates is missing or not an array', () => {
    const noUpdates = { foo: 'bar' }
    transformSource(noUpdates, 'RMC', 'GP').should.equal(noUpdates)
    const badUpdates = { updates: 'not an array' }
    transformSource(badUpdates, 'RMC', 'GP').should.equal(badUpdates)
  })

  it('replaces SignalK placeholder talker "nmea0183" with "SK"', () => {
    const data = {
      updates: [{ source: '', values: [] }]
    }
    const result = transformSource(data, 'XXX', 'nmea0183') as any
    result.updates[0]!.source.talker.should.equal('SK')
    result.updates[0]!.source.sentence.should.equal('XXX')
    result.updates[0]!.source.type.should.equal('NMEA0183')
  })

  it('leaves existing object sources untouched', () => {
    const existingSource = {
      label: 'real',
      type: 'x',
      sentence: 'A',
      talker: 'B'
    }
    const data = {
      updates: [{ source: existingSource, values: [] }]
    }
    transformSource(data, 'RMC', 'GP').updates[0]!.source.should.equal(
      existingSource
    )
  })

  it('parses "talker:sentence" style string sources', () => {
    const data = {
      updates: [{ source: 'TK:SENT', values: [] }]
    }
    const result = transformSource(data, 'FALLBACK', 'FB') as any
    result.updates[0]!.source.talker.should.equal('TK')
    result.updates[0]!.source.sentence.should.equal('SENT')
  })

  it('falls back to passed-in sentence and talker when source is empty', () => {
    const data = {
      updates: [{ source: '', values: [] }]
    }
    const result = transformSource(data, 'RMC', 'GP') as any
    result.updates[0]!.source.talker.should.equal('GP')
    result.updates[0]!.source.sentence.should.equal('RMC')
  })
})
