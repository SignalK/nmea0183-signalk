var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');


var nmeaLine = "$PIVWR,75,R,1.0,N,0.51,M,1.85,K*75";

describe('VPW', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent');
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedApparent');
      var full = signalkSchema.deltaToFull(delta);
      signalkSchema.fillIdentity(full);
      full.should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine);
  })

});
