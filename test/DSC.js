const Parser = require('../lib')
const chai = require('chai')
var signalkSchema = require('signalk-schema')
var nmeaLine_pos = "$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B";
var nmeaLine_distress = "$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A";


describe('DSC', () => {

  it('Position converts ok', done => {
    const parser = new Parser

    parser
    .on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137');
      //var full = signalkSchema.deltaToFull(delta);
      //full.should.be.validSignalK;
      done();
    })
    .parse(nmeaLine_pos)
  })

  it('Distress converts ok', done => {
    const parser = new Parser

    parser
    .on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.adrift');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079');
      //var full = signalkSchema.deltaToFull(delta);
      //full.should.be.validSignalK;
      done();
    })
    .parse(nmeaLine_distress)
  })

})
