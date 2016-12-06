var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));


var heading = "$STALK,84,B6,10,00,00,00,00,00,00*14"
var standby = "$STALK,84,E6,15,00,00,00,00,00,08*1E"
var auto = "$STALK,84,56,5E,79,02,00,00,00,08*16"
var wind = "$STALK,84,06,00,00,04,00,00,00,00*63"
var route = "$STALK,84,06,00,00,08,00,00,00,00*6F"
var rudder = "$STALK,84,06,00,00,08,00FE,00,00*6C"
var heading_nineC = "$STALK,9C,51,1E,00*4B"

parser = new(require('../lib/').Parser)();

describe('STALK', function(done) {
  it('0x84 heading converted', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 5.305800926062761
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(heading);
  })
  it('0x84 ap mode: standby converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': "standby"
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(standby);
  })
  it('0x84 ap mode: auto converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': "auto"
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(auto);
  })
  it('0x84 ap mode: wind converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': "wind"
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(wind);
  })
  it('0x84 ap mode: route converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': "route"
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(route);
  })
  it('0x84 rudder angle converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.rudderAngle',
        'value': -0.03490658503988659
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(rudder);
    done();
  })
  it('0x84 ap target heading  converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'steering.autopilot.target.headingMagnetic',
        'value': 2.626720524251466
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(auto);
  })
  it('0x9C ap target heading  converted', function(done) {
    var parser = new(require('../lib/').Parser)();
    parser.on('delta', function(delta) {
            delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 2.6529004630313806
      });
      delta.should.be.validSignalKDelta;
      done();
    });
    parser.write(heading_nineC);
  })
});
