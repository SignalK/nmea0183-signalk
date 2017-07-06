var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');

describe('ZDA', function() {
  it('converts ok 2004-03-11 16:00', function(done) {
    var nmeaLine = "$GPZDA,160012.71,11,03,2004,-1,00*7D";
    assertZDA(nmeaLine, {
      'path': 'navigation.datetime',
      'value': '2004-03-11T16:00:12.000Z'
    }, done)
  })

  it('converts ok 2014-04-16 19:57', function(done) {
    var nmeaLine = "$GPZDA,195720,16,04,14,-02,00*69";
    assertZDA(nmeaLine, {
      'path': 'navigation.datetime',
      'value': '2014-04-16T19:57:20.000Z'
    }, done)
  })
});


function assertZDA(nmeaLine, expected, done) {
  parser = new(require('../lib/').Parser)({selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'});
  parser.on('delta', function(delta) {
    delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.datetime');
    var full = signalkSchema.deltaToFull(delta);
    full.should.be.validSignalK;
    delta.updates[0].values.should.include(expected);
    done();
  });
  parser.write(nmeaLine);
}
