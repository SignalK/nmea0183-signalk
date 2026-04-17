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
})
