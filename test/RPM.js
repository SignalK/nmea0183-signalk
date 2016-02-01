var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$IIRPM,E,1,2418.2,10.5,A*7B";

describe('RPM', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'propulsion.revolutions');
      done();
    });
    parser.write(nmeaLine);
  })
});
