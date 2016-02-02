var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$IIRPM,E,1,2418.2,10.5,A*5F";

describe('RPM', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.should.be.validSignalKDelta;
      delta.updates[0].values[0].path.should.equal('propulsion.engine1.rpm');
      done();
    });
    parser.write(nmeaLine);
  })
});
