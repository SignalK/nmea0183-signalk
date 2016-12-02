var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');


var nmeaLine_pos = "$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B";
var nmeaLine_distress = "$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A";

describe('DSC Position', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137');
      var full = signalkSchema.deltaToFull(delta);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine_pos);
  })
});

describe('DSC Distress', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position');
      delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.adrift');
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079');
      var full = signalkSchema.deltaToFull(delta);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine_distress);
  })
});
