var Parser  = require('../lib/Parser');
var chai    = require('chai');
var expect  = require('chai').expect;


describe('NMEA0183:', function() {
  it('GLL', function(done) {
    
    Parser.parse('$GPGLL,5233.0040,N,00527.1160,E,151033.750,A,A*5B', function(err, result) {
      // Validate the delta message
      expect(result).to.be.an('object');
      expect(result.context).to.equal('vessels.self');
      expect(result.updates).to.be.an('array');
      expect(result.updates).to.have.length(1);

      // Validate the updates
      expect(result.updates[0].source).to.be.an('object');
      expect(result.updates[0].source.sentence).to.equal('GLL');
      expect(result.updates[0].values).to.be.an('array');
      expect(result.updates[0].values).to.have.length(1);

      // Validate the values in the update
      expect(result.updates[0].values[0]).to.be.an('object');
      expect(result.updates[0].values[0].path).to.equal('navigation.position');
      expect(result.updates[0].values[0].value).to.be.an('object');
      expect(result.updates[0].values[0].value.latitude).to.equal(52.550066666666666);
      expect(result.updates[0].values[0].value.longitude).to.equal(5.451933333333334);
      
      done();
    });
  })

  it('RMC', function(done) {
    
    Parser.parse('$GPRMC,195719,A,5310.8115,N,00525.7025,E,0.0,0.0,160414,0.7,E,A*10', function(err, result) {
      expect(result).to.be.an('object')
      expect(result.context).to.equal('vessels.self')
      expect(result.updates).to.be.an('array')
      expect(result.updates[0].timestamp).to.be.a('string')
      expect(result.updates[0].source).to.be.an('object')
      expect(result.updates[0].source.sentence).to.equal('RMC')
      expect(result.updates[0].values).to.be.an('array')
      expect(result.updates[0].values).to.have.length(4)   
      expect(result.updates[0].values[0]).to.be.an('object')
      expect(result.updates[0].values[0].path).to.equal('navigation.position')
      expect(result.updates[0].values[1]).to.be.an('object')
      expect(result.updates[0].values[1].path).to.equal('navigation.courseOverGroundTrue')
      expect(result.updates[0].values[2]).to.be.an('object')
      expect(result.updates[0].values[2].path).to.equal('navigation.speedOverGround')
      expect(result.updates[0].values[3]).to.be.an('object')
      expect(result.updates[0].values[3].path).to.equal('navigation.magneticVariation')
      done()
    });
  })
});