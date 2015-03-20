var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$IIDBT,035.53,f,010.83,M,005.85,F*23";

describe('DBT', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      console.log(JSON.stringify(delta, null, 2));
      delta.updates[0].values.should.contain.an.item.with.property('path', '"environment.depth.belowTransducer');
      done();
    });
    parser.write(nmeaLine);
  })
});