/**
 * Tests for timestampFromTimeOfDay: the date selection itself, then every
 * hook that uses it, run through the Parser.
 */

import * as chai from 'chai'
import Parser from '../src/lib'
import timestampFromTimeOfDay from '../src/lib/timestampFromTimeOfDay'
import withClock from './helpers/with-clock'
const should = chai.Should()

describe('timestampFromTimeOfDay', () => {
  it('keeps the reference date when the time is close to the reference', () => {
    should.equal(
      timestampFromTimeOfDay('121022', '2026-09-12T12:10:23.500Z'),
      '2026-09-12T12:10:22.000Z'
    )
  })

  it('dates 23:59:59 to the previous day once the reference passed midnight', () => {
    // Field capture: a GLL fix stamped 23:59:59 reached the host 0.691 s
    // after midnight.
    should.equal(
      timestampFromTimeOfDay('235959', '2026-09-12T00:00:00.691Z'),
      '2026-09-11T23:59:59.000Z'
    )
  })

  it('dates 00:00:00 to the next day while the reference is still before midnight', () => {
    // Host clock trailing the GNSS clock by a fraction of a second.
    should.equal(
      timestampFromTimeOfDay('000000', '2026-09-11T23:59:59.900Z'),
      '2026-09-12T00:00:00.000Z'
    )
  })

  it('takes the date from a reference on another day, as when replaying a log', () => {
    should.equal(
      timestampFromTimeOfDay('101530', '2025-06-01T10:15:31.000Z'),
      '2025-06-01T10:15:30.000Z'
    )
  })

  it('falls back to the host clock without a reference', () => {
    should.equal(
      withClock('2026-09-12T00:00:00.691Z', () =>
        timestampFromTimeOfDay('235959')
      ),
      '2026-09-11T23:59:59.000Z'
    )
  })

  it('returns the reference unchanged when the sentence has no time', () => {
    should.equal(
      timestampFromTimeOfDay('', '2025-06-02T00:00:00.000Z'),
      '2025-06-02T00:00:00.000Z'
    )
    should.equal(timestampFromTimeOfDay(''), undefined)
  })

  it('rolls back across a month and year boundary', () => {
    should.equal(
      timestampFromTimeOfDay('235959', '2027-01-01T00:00:00.300Z'),
      '2026-12-31T23:59:59.000Z'
    )
  })

  it('keeps millisecond precision from fractional seconds', () => {
    should.equal(
      timestampFromTimeOfDay('235959.75', '2026-09-12T00:00:01.000Z'),
      '2026-09-11T23:59:59.750Z'
    )
  })

  it('carries a leap second 23:59:60 into 00:00:00 of the next day', () => {
    // JavaScript dates cannot represent the leap second inserted at
    // 2016-12-31T23:59:60Z, so it normalizes to the following midnight.
    should.equal(
      timestampFromTimeOfDay('235960', '2017-01-01T00:00:00.500Z'),
      '2017-01-01T00:00:00.000Z'
    )
  })

  describe('with the reference at noon, results stay within [-12 h, +12 h)', () => {
    const noon = '2026-09-12T12:00:00.000Z'

    it('keeps a time just under 12 hours ahead', () => {
      should.equal(
        timestampFromTimeOfDay('235959.999', noon),
        '2026-09-12T23:59:59.999Z'
      )
    })

    it('keeps a time just under 12 hours behind', () => {
      should.equal(
        timestampFromTimeOfDay('000000.001', noon),
        '2026-09-12T00:00:00.001Z'
      )
    })

    it('resolves a time exactly 12 hours away to the past', () => {
      should.equal(
        timestampFromTimeOfDay('000000', noon),
        '2026-09-12T00:00:00.000Z'
      )
    })
  })
})

describe('time-only sentences through the Parser', () => {
  // One row per hook that dates its time field with timestampFromTimeOfDay;
  // add a row when another hook starts using it. Every sentence is stamped
  // 23:59:59.
  const sentences: Array<[string, string]> = [
    [
      'GGA',
      '$GNGGA,235959.000,3819.16721,N,02133.08984,E,1,12,0.8,12.3,M,36.1,M,,*72'
    ],
    ['GLL', '$GNGLL,3819.16721,N,02133.08984,E,235959.000,A,A*48'],
    [
      'GNS',
      '$GNGNS,235959.00,3819.16721,N,02133.08984,E,AAN,12,0.8,12.3,36.1,,,S*59'
    ],
    [
      'BWC',
      '$GPBWC,235959,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*29'
    ],
    [
      'BWR',
      '$GPBWR,235959,4917.24,N,12309.57,W,051.9,T,031.6,M,001.3,N,004*38'
    ],
    [
      'RMC without a date',
      '$GNRMC,235959.000,A,3819.16721,N,02133.08984,E,0.0,0.0,,,,A*7F'
    ]
  ]

  sentences.forEach(([name, sentence]) => {
    it(`${name}: dates a sentence received just after UTC midnight to the previous day`, () => {
      // As in the field capture: the sentence reached the host 0.691 s after
      // its clock passed midnight, and the host date would put it almost 24
      // hours in the future.
      const delta = withClock('2026-09-12T00:00:00.691Z', () =>
        new Parser().parse(sentence)
      ) as any
      delta.updates[0]!.timestamp.should.equal('2026-09-11T23:59:59.000Z')
    })

    it(`${name}: dates a replayed sentence by its tag block time, not the host clock`, () => {
      // Replay of a log recorded around midnight: the tag block time
      // (c:1748822400 -> 2025-06-02T00:00:00Z) decides the date.
      const delta = withClock('2026-09-12T10:00:00.000Z', () =>
        new Parser().parse(`\\s:logger,c:1748822400*2E\\${sentence}`)
      ) as any
      delta.updates[0]!.timestamp.should.equal('2025-06-01T23:59:59.000Z')
    })
  })
})
