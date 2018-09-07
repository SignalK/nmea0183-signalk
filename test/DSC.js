const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()
chai.use(require('chai-things'))

const nmeaLinePos = "$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B";
const nmeaLineDistress = "$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A";
const emptyNmeaLine = "$CDDSC,,,,,,,,,,,*7F";

describe('DSC', () => {
  it('Position converts ok', () => {
    const delta = new Parser().parse(nmeaLinePos)

    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137');
  })

  it('Distress converts ok', () => {
    const delta = new Parser().parse(nmeaLineDistress)

    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
    delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.adrift');
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079');
  })

  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse(emptyNmeaLine)
    should.equal(delta, null)
  })
})
