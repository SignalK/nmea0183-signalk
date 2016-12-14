'use strict'

const Parser = require('../lib')
const chai = require('chai')
chai.Should()
chai.use(require('chai-things'))
const signalkSchema = require('signalk-schema')



const nmeaLines = [
  '!AIVDM,2,1,0,A,53brRt4000010SG700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*1E\n',
  '!AIVDM,2,2,0,A,`0000000001,2*75\n'
]

describe('VDM', function() {
  it(' multiline converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      // validate schema conformance
      const full = signalkSchema.deltaToFull(delta)
      signalkSchema.fillIdentity(full)
      full.should.be.validSignalK

      full.vessels['urn:mrn:imo:mmsi:246326000'].should.have.property('mmsi', '246326000')
      full.vessels['urn:mrn:imo:mmsi:246326000'].should.have.property('name', 'LUTGERDINA')
      done()
    })

    parser.parse(nmeaLines[0])
    parser.parse(nmeaLines[1])
  })

  it(' single line converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      // validate schema conformance
      const full = signalkSchema.deltaToFull(delta)
      signalkSchema.fillIdentity(full)
      full.should.be.validSignalK

      delta.updates[0].values.length.should.equal(5)

      full.vessels['urn:mrn:imo:mmsi:232002939'].should.have.property('mmsi', '232002939')
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.courseOverGroundTrue.should.have.property('value', 6.021385919380437)
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.speedOverGround.should.have.property('value', 0)
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.headingTrue.should.have.property('value', 0.08726646259971647)
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.position.should.have.property('latitude', 50.806205)
      full.vessels['urn:mrn:imo:mmsi:232002939'].navigation.position.should.have.property('longitude', -1.10399)
      done()
    })
    parser.parse('!AIVDM,1,1,,B,13M@ENw000OrtT<M4U2uNP20<2<,0*39\n')
  })
})
