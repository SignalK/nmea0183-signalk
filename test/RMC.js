var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));

chai.use(require('signalk-schema').chaiModule);


var nmeaLine = "$GPRMC,195719,A,5310.8115,N,00525.7025,E,0.0,0.0,160414,0.7,E,A*10";
var nmeaLine2= "$GPRMC,085412.000,A,5222.3198,N,00454.5784,E,0.58,251.34,030414,,,A*65";

describe('RMC', function() {
  it('line 1 converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values[0].path.should.equal('navigation.position');
      delta.updates[0].values[0].value.latitude.should.be.closeTo(53.1801916666667, 0.000005);
      delta.updates[0].values[0].value.longitude.should.be.closeTo(5.428375, 0.000005);
      delta.updates[0].values[1].path.should.equal('navigation.courseOverGroundTrue');
	  delta.updates[0].values[1].value.should.be.closeTo(0.0,0.000005);
      delta.updates[0].values[2].path.should.equal('navigation.speedOverGround');
	  delta.updates[0].values[2].value.should.be.closeTo(0.0,0.000005);
      delta.updates[0].values[3].path.should.equal('navigation.datetime');
	  delta.updates[0].values[3].value.should.equal('2014-04-16T19:57:19Z');
      delta.updates[0].values[4].path.should.equal('navigation.magneticVariation');	  
	  delta.updates[0].values[4].value.should.be.closeTo(0.01221730476396,0.000005);
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(nmeaLine);
  })
  
  it('line 2 converts ok', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
      delta.updates[0].values[0].path.should.equal('navigation.position');
      delta.updates[0].values[0].value.latitude.should.be.closeTo(52.3719966666667, 0.000005);
      delta.updates[0].values[0].value.longitude.should.be.closeTo(4.90964, 0.000005);
      delta.updates[0].values[1].path.should.equal('navigation.courseOverGroundTrue');
	  delta.updates[0].values[1].value.should.be.closeTo(4.38671054196255,0.000005);
      delta.updates[0].values[2].path.should.equal('navigation.speedOverGround');
	  delta.updates[0].values[2].value.should.be.closeTo(0,29837752,0.0005);
      delta.updates[0].values[3].path.should.equal('navigation.datetime');
	  delta.updates[0].values[3].value.should.equal('2014-04-03T08:54:12Z');
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(nmeaLine2);
  })
  

    it('does not throw error with malformed data', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.write("$GPRMC,085412.000,A,5222.3198N,00454.5784,E,0.58,251.34,030414,A*65");
    done();
  })

});