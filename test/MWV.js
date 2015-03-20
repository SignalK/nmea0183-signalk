var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$IIMWV,074,T,05.85,N,A*2E";

describe('MWV', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      console.log(JSON.stringify(delta, null, 2));
      delta.updates[0].values.should.contain.an.item.with.property('path', '"environment.wind.angleTrue');
      done();
    });
    parser.write(nmeaLine);
  })
});