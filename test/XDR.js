var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');



describe('YXDDR', function() {
  it('converts ok', function(done) {
    var nmeaLine = "$YXXDR,C,7,C*54";
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.outside.temperature');
      delta.updates[0].values.should.contain.an.item.with.property('value', 280.15);
      var full = signalkSchema.deltaToFull(delta);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine);
  })
});
