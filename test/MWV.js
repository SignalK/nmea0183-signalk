var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var nmeaLine = "$IIMWV,074,T,05.85,N,A*2E";
var emptyNmeaLine = '$IIMWV,,,,*4C';

describe('MWV', function() {
  it('converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater');
      done();
    });
    parser.write(nmeaLine);
  })

  it('handles empty fields without throwing errors', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.write(emptyNmeaLine);
    done();
  })
});

