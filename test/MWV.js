var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');


var nmeaLine = "$IIMWV,074,T,05.85,N,A*2E";
var emptyNmeaLine = '$IIMWV,,,,*4C';

describe('MWV', function() {
  it('true converts ok', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfType: 'mmsi',
      selfId:  'urn:mrn:imo:mmsi:230099999'
    });
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater');
      delta.updates[0].values.should.contain.an.item.with.property('value', 1.2915436464758039);
      signalkSchema.deltaToFull(delta).should.be.validSignalK;
      done();
    });
    parser.write(nmeaLine);
  })

  it('apparent converts ok', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfType: 'mmsi',
      selfId:  'urn:mrn:imo:mmsi:230099999'
    });
    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent');
      delta.updates[0].values.should.contain.an.item.with.property('value', -0.41887902047863906);
      signalkSchema.deltaToFull(delta).should.be.validSignalK;
      done();
    });
    parser.write('$IIMWV,336,R,13.41,N,A*22');
  })

  it('handles empty fields without throwing errors', function(done) {
    parser = new(require('../lib/').Parser)();
    parser.write(emptyNmeaLine);
    done();
  })
});
