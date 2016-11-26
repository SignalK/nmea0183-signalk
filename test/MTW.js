var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');


var nmeaLine = "$YXMTW,15.2,C*14";

describe('MTW', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.water.temperature');
      delta.updates[0].values[0].value.should.be.closeTo(288.35,0.001);

      var full = signalkSchema.deltaToFull(delta);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine);
  })
});
