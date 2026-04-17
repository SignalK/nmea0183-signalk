const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()
chai.use(require('./helpers/chai-has-item'))

const nmeaLinePos = '$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B'
const nmeaLineDistress =
  '$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A'
const emptyNmeaLine = '$CDDSC,,,,,,,,,,,*7F'
// Routine category (parts[2]='00') with a telecommand (parts[3]='22') the
// parser doesn't currently map — exercises the "not handled" branch which
// used to throw ReferenceError (line undefined).
const nmeaLineUnhandled =
  '$CDDSC,20,3381581370,00,22,26,1423108312,1902,,,B,E*78'
const nmeaLineSafety = '$CDDSC,20,3381581370,08,00,00,1423108312,1902,,,B,E*74'
const nmeaLineUrgency = '$CDDSC,20,3381581370,10,00,00,1423108312,1902,,,B,E*7D'

// Each distress nature code maps to a specific notification path. Every code
// must be exercised so that the mapping table in DSC.js cannot silently drift.
const distressCases = [
  { code: '00', path: 'notifications.fire' },
  { code: '01', path: 'notifications.flooding' },
  { code: '02', path: 'notifications.collision' },
  { code: '03', path: 'notifications.grounding' },
  { code: '04', path: 'notifications.listing' },
  { code: '05', path: 'notifications.sinking' },
  { code: '06', path: 'notifications.adrift' },
  { code: '07', path: 'notifications.undesignated' },
  { code: '08', path: 'notifications.abandon' },
  { code: '09', path: 'notifications.piracy' },
  { code: '10', path: 'notifications.mob' },
  { code: '12', path: 'notifications.epirb' },
  { code: '99', path: 'notifications.unassigned' }
]
const distressSentences = {
  '00': '$CDDSC,12,3380400790,12,00,00,1423108312,2019,,,S,E*6C',
  '01': '$CDDSC,12,3380400790,12,01,00,1423108312,2019,,,S,E*6D',
  '02': '$CDDSC,12,3380400790,12,02,00,1423108312,2019,,,S,E*6E',
  '03': '$CDDSC,12,3380400790,12,03,00,1423108312,2019,,,S,E*6F',
  '04': '$CDDSC,12,3380400790,12,04,00,1423108312,2019,,,S,E*68',
  '05': '$CDDSC,12,3380400790,12,05,00,1423108312,2019,,,S,E*69',
  '06': nmeaLineDistress,
  '07': '$CDDSC,12,3380400790,12,07,00,1423108312,2019,,,S,E*6B',
  '08': '$CDDSC,12,3380400790,12,08,00,1423108312,2019,,,S,E*64',
  '09': '$CDDSC,12,3380400790,12,09,00,1423108312,2019,,,S,E*65',
  10: '$CDDSC,12,3380400790,12,10,00,1423108312,2019,,,S,E*6D',
  12: '$CDDSC,12,3380400790,12,12,00,1423108312,2019,,,S,E*6F',
  99: '$CDDSC,12,3380400790,12,99,00,1423108312,2019,,,S,E*6C'
}

describe('DSC', () => {
  it('Position converts ok', () => {
    const delta = new Parser().parse(nmeaLinePos)

    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137')
  })

  it('Distress converts ok', () => {
    const delta = new Parser().parse(nmeaLineDistress)

    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'navigation.position'
    )
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'notifications.adrift'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079')
  })

  distressCases.forEach(({ code, path }) => {
    it(`Distress nature ${code} maps to ${path}`, () => {
      const delta = new Parser().parse(distressSentences[code])
      delta.updates[0].values.should.containItemWithProperty('path', path)
      delta.updates[0].values
        .find((v) => v.path === path)
        .value.message.should.match(/DSC Distress Recieved/)
    })
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse(emptyNmeaLine)
    should.equal(delta, null)
  })

  it('Unhandled sentence produces a notification without throwing', () => {
    const delta = new Parser().parse(nmeaLineUnhandled)

    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'notifications.dsc_parser'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137')
  })

  it('Consecutive parses return independent deltas (no shared state)', () => {
    // Guards against a previous module-scope `delta` variable that leaked
    // across invocations. Each call must return a fresh object with its own
    // context — not a reference to the hook's prior result.
    const parser = new Parser()
    const d1 = parser.parse(nmeaLinePos)
    const d2 = parser.parse(nmeaLineDistress)
    d1.should.not.equal(d2)
    d1.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137')
    d2.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079')
  })

  it('Position with quadrant=2 (SE) negates latitude', () => {
    const delta = new Parser().parse(
      '$CDDSC,12,3380400790,12,06,00,2423108312,2019,,,S,E*69'
    )
    const position = delta.updates[0].values.find(
      (v) => v.path === 'navigation.position'
    ).value
    position.latitude.should.be.lessThan(0)
    position.longitude.should.be.greaterThan(0)
  })

  it('Position with quadrant=3 (SW) negates both latitude and longitude', () => {
    const delta = new Parser().parse(
      '$CDDSC,12,3380400790,12,06,00,3423108312,2019,,,S,E*68'
    )
    const position = delta.updates[0].values.find(
      (v) => v.path === 'navigation.position'
    ).value
    position.latitude.should.be.lessThan(0)
    position.longitude.should.be.lessThan(0)
  })

  it('Safety category (08) falls through to unhandled notification', () => {
    const delta = new Parser().parse(nmeaLineSafety)
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'notifications.dsc_parser'
    )
  })

  it('Urgency category (10) falls through to unhandled notification', () => {
    const delta = new Parser().parse(nmeaLineUrgency)
    delta.updates[0].values.should.containItemWithProperty(
      'path',
      'notifications.dsc_parser'
    )
  })
})
