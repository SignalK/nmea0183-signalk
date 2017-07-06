var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));

chai.use(require('signalk-schema').chaiModule);


var nmeaLine = "$GPGLL,5958.613,N,02325.928,E,121022,A,D*40";

describe('GLL', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values[0].path.should.equal('navigation.position');
      delta.updates[0].values[0].value.latitude.should.be.closeTo(59.9768833, 0.000005);
      delta.updates[0].values[0].value.longitude.should.be.closeTo(23.432133, 0.000005);
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(nmeaLine);
  })

    it('does not throw error with malformed data', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.write("$GPGLL,4840.434N,12325.053,W,191313.74A,D*7F");
    done();
  })

});