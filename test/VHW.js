var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');



describe('VHW', function() {
  it('speed data only', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.include({
        'path': 'navigation.speedThroughWater',
        'value': 3.147222222222222
      });


      signalkSchema.deltaToFull(delta).should.be.validSignalK;
      done();
    });
    parser.write('$IIVHW,,T,,M,06.12,N,11.33,K*50');
  })

  it('speed & direction data', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.include({
        'path': 'navigation.speedThroughWater',
        'value': 0
      });
      delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 3.1730085801256913
      });
      delta.updates[0].values.should.include({
        'path': 'navigation.headingTrue',
        'value': 3.1852258848896517
      });
      signalkSchema.deltaToFull(delta).should.be.validSignalK;
      done();
    });
    parser.write('$SDVHW,182.5,T,181.8,M,0.0,N,0.0,K*4C');
  })


});
