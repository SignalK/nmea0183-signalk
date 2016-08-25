var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var headingAndDeviation = "$SDHDG,181.9,,,0.6,E*32"

parser = new(require('../lib/').Parser)();

describe('HDG', function() {
  it('heading and deviation are converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values[0].path.should.equal('navigation.headingMagnetic');
      delta.updates[0].values[0].value.should.equal(181.9 / 180 * Math.PI)
      delta.updates[0].values[1].path.should.equal('navigation.magneticVariation');
      delta.updates[0].values[1].value.should.equal(0.6 / 180 * Math.PI)
      done();
    });
    parser.write(headingAndDeviation);
  })
});
