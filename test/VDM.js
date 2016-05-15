var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');



var nmeaLines = [
  "!AIVDM,2,1,0,A,53brRt4000010SG;700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*1E\n",
  "!AIVDM,2,2,0,A,`0000000001,2*75\n"
];

describe('VDM', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser.on('delta', function(delta) {
      console.log(JSON.stringify(delta))
      // asserts for delta contents go here

      // validate schema conformance
      // var full = signalkSchema.deltaToFull(delta);
      // signalkSchema.fillIdentity(full);
      // full.should.be.validSignalK;
      // done();
    });
    parser.write(nmeaLines[0]);
    parser.write(nmeaLines[1]);
  })

});
