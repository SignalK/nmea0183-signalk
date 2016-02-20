var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');



var nmeaLine = "$IIRPM,E,1,2418.2,10.5,A*5F";

describe('RPM', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.should.be.validSignalKDelta;
      delta.updates[0].values[0].path.should.equal('propulsion.engine1.revolutions');
      var full = signalkSchema.deltaToFull(delta);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine);
  })
});
