var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$GPROT,35.6,A*01";

describe('ROT', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.rateOfTurn');
      delta.updates[0].values[0].value.should.equal(35.6 / 180 * Math.PI / 60)
      done();
    });
    parser.write(nmeaLine);
  })
});
