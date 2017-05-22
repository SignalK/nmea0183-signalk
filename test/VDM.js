var chai = require("chai");
chai.Should();
chai.use(require('chai-things'));
var signalkSchema = require('signalk-schema');
const _ = require('lodash')



var nmeaLines = [
  "!AIVDM,2,1,0,A,53brRt4000010SG;700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*1E\n",
  "!AIVDM,2,2,0,A,`0000000001,2*75\n",
  '!AIVDM,2,1,0,A,58wt8Ui`g??r21`7S=:22058<v05Htp000000015>8OA;0sk,0*7B\n',
  '!AIVDM,2,2,0,A,eQ8823mDm3kP00000000000,2*5D\n'
];

describe('VDM', function() {
  it(' multiline converts ok', function(done) {
    const countDones = _.after(2, done)
    var parser1 = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser1.on('delta', function(delta) {
      // validate schema conformance
      var full = signalkSchema.deltaToFull(delta);
      signalkSchema.fillIdentity(full);
      full.should.be.validSignalK;

      full.vessels['urn:mrn:imo:mmsi:246326000'].should.have.property('mmsi', '246326000');
      full.vessels['urn:mrn:imo:mmsi:246326000'].should.have.property('name', 'LUTGERDINA');
      countDones();
    });

    var parser2 = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021e'
    });
    parser2.on('delta', function(delta) {
      // validate schema conformance
      var full = signalkSchema.deltaToFull(delta);
      signalkSchema.fillIdentity(full);
      full.should.be.validSignalK;

      full.vessels['urn:mrn:imo:mmsi:603916439'].should.have.property('mmsi', '603916439');
      full.vessels['urn:mrn:imo:mmsi:603916439'].should.have.property('name', 'ARCO AVON');
      countDones();
    });
    parser1.write(nmeaLines[0]);
    parser2.write(nmeaLines[2]);
    parser1.write(nmeaLines[1]);
    parser2.write(nmeaLines[3]);
  })

  it(' single line converts ok', function(done) {
    var parser = new(require('../lib/').Parser)({
      selfId: 'urn:mrn:signalk:uuid:c0d79334-4e25-4245-8892-54e8ccc8021d'
    });
    parser.on('delta', function(delta) {
      // validate schema conformance
      var full = signalkSchema.deltaToFull(delta);
      signalkSchema.fillIdentity(full);
      full.should.be.validSignalK;

      delta.updates[0].values.length.should.equal(5);

      full.vessels['urn:mrn:imo:mmsi:232002939'].should.have.property('mmsi', '232002939');
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.courseOverGroundTrue.should.have.property('value', 6.021385919380437);
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.speedOverGround.should.have.property('value', 0);
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.headingTrue.should.have.property('value', 0.08726646259971647);
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.position.should.have.property('latitude', 50.806205);
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.position.should.have.property('longitude', -1.10399);
      done();
    });
    parser.write("!AIVDM,1,1,,B,13M@ENw000OrtT<M4U2uNP;20<2<,0*39\n");
  })


});
