var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));

chai.use(require('signalk-schema').chaiModule);

var multiple = '$OSXDR,C,9.5,C,1W0,C,9.0,C,1W1*56';
var single= '$YXXDR,C,7,C*54';
var noname = '$WIXDR,C,022.0,C,,*52';

describe('XDR', function() {
	
  it('converts single sensor value ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
			
      delta.updates[0].values[0].path.should.equal('sensors.C0.name');
			delta.updates[0].values[1].path.should.equal('sensors.C0.sensorType');
			delta.updates[0].values[2].path.should.equal('sensors.C0.sensorData'); 
      delta.updates[0].values[0].value.should.equal('C0');
			delta.updates[0].values[1].value.should.equal('C');
			delta.updates[0].values[2].value.should.equal('7');  
      delta.should.be.validSignalKDelta;
			
      done();
    });
    parser.write(single);
  })
	
  it('converts multiple sensor values ok', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
      delta.updates[0].values[0].path.should.equal('sensors.1W0.name');
			delta.updates[0].values[1].path.should.equal('sensors.1W0.sensorType');
			delta.updates[0].values[2].path.should.equal('sensors.1W0.sensorData'); 
      delta.updates[0].values[0].value.should.equal('1W0');
			delta.updates[0].values[1].value.should.equal('C');
			delta.updates[0].values[2].value.should.equal('9.5'); 
			
      delta.updates[1].values[0].path.should.equal('sensors.1W1.name');
			delta.updates[1].values[1].path.should.equal('sensors.1W1.sensorType');
			delta.updates[1].values[2].path.should.equal('sensors.1W1.sensorData'); 
      delta.updates[1].values[0].value.should.equal('1W1');
			delta.updates[1].values[1].value.should.equal('C');
			delta.updates[1].values[2].value.should.equal('9.0'); 
			
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(multiple);
  })
	
  it('converts sensor value without name', function(done) {
    parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
    parser.on('delta', function(delta) {
			
      delta.updates[0].values[0].path.should.equal('sensors.C0.name');
			delta.updates[0].values[1].path.should.equal('sensors.C0.sensorType');
			delta.updates[0].values[2].path.should.equal('sensors.C0.sensorData'); 
      delta.updates[0].values[0].value.should.equal('C0');
			delta.updates[0].values[1].value.should.equal('C');
			delta.updates[0].values[2].value.should.equal('022.0');  
      delta.should.be.validSignalKDelta;
			
      done();
    });
    parser.write(noname);
  })
});