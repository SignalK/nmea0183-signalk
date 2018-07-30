const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

const nmeaLinePos = "$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B";
const nmeaLineDistress = "$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A";
const emptyNmeaLine = "$CDDSC,,,,,,,,,,,*7F";

chai.use(require('chai-things'))

describe('DSC', () => {
  it('Position converts ok', done => {
    const parser = new Parser()

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137');
      done();
    })
    parser.parse(nmeaLinePos)
  })

  it('Distress converts ok', done => {
    const parser = new Parser()

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.adrift');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079');
      done();
    })
    parser.parse(nmeaLineDistress)
  })

  it('Doesn\'t choke on empty sentences', () => {
    const result = new Parser().parseImmediate(emptyNmeaLine)
    should.equal(result, null)
  })
})
