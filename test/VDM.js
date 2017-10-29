'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))
const toFull = require('./toFull')

const sentences = [
  '!AIVDM,2,1,0,A,53brRt4000010SG700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*25\n',
  '!AIVDM,2,2,0,A,`0000000001,2*75\n'
]

describe('VDM', function() {

  it('Multiline converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      should.not.exist(delta.updates[0].source.label)
      delta.updates[0].source.talker.should.equal('AI')

      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:246326000')
      delta.updates[0].values[0].value.mmsi.should.equal('246326000')
      delta.updates[0].values[1].path.should.equal('')
      delta.updates[0].values[1].value.should.deep.equal({name: 'UTGERDINA'})
      delta.updates[0].values[2].path.should.equal('')
      delta.updates[0].values[2].value.should.deep.equal({design: {length: {overall: 641}}})
      delta.updates[0].values[3].path.should.equal('')
      delta.updates[0].values[3].value.should.deep.equal({design:{beam: 65}})
      delta.updates[0].values[4].path.should.equal('')
      delta.updates[0].values[4].value.should.deep.equal({design:{draft:{maximum:14.1}}})
      delta.updates[0].values[5].path.should.equal('sensors.ais.fromBow')
      delta.updates[0].values[5].value.should.equal(256)
      delta.updates[0].values[6].path.should.equal('sensors.ais.fromCenter')
      delta.updates[0].values[6].value.should.equal(-27.5)
      delta.updates[0].values[7].path.should.equal('navigation.destination.commonName')
      delta.updates[0].values[7].value.should.equal('OOI SILEN')
      delta.updates[0].values[8].path.should.equal('')
      delta.updates[0].values[8].value.should.deep.equal({communication:{callsignVhf: 'PH510'}})
      delta.updates[0].values[9].path.should.equal('design.aisShipType')
      delta.updates[0].values[9].value.id.should.equal(67)
      delta.updates[0].values[9].value.name.should.equal('Passenger ship')

      toFull(delta).should.be.validSignalK

      done()
    })

    parser.parse(sentences[0]).catch(e => { done(e) })
    parser.parse(sentences[1]).catch(e => { done(e) })
  })

  it('Single line converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:244670316')
      done()
    })

    parser
    .parse('!AIVDM,1,1,,A,13aEOK?P00PD2wVMdLDRhgvL289?,0*26\n')
    .catch(e => { done(e) })
  })

  it('AtoN converts ok', done => {
    const parser = new Parser
    parser.on('signalk:delta', delta => {
      delta.context.should.equal('atons.urn:mrn:imo:mmsi:993672087')
      delta.updates[0].values[1].value.name.should.equal('46')
      delta.updates[0].values[2].path.should.equal('navigation.position')
      delta.updates[0].values[2].value.longitude.should.equal(-76.128155)
      delta.updates[0].values[2].value.latitude.should.equal(39.36828666666667)
      delta.updates[0].values[3].path.should.equal('atonType')
      delta.updates[0].values[3].value.name.should.equal('Beacon, Starboard Hand')
      delta.updates[0].values[3].value.id.should.equal(14)
      done()
    })

    parser
      .parse('!AIVDM,1,1,,A,E>k`sUoJK@@@@@@@@@@@@@@@@@@MAhJS;@neP00000N000,0*0D\n')
      .catch(e => { done(e) })
  })

  it('Doesn\'t choke on empty sentences', done => {
    const parser = new Parser
    parser
    .parse('!AIVDM,,,,,,*57')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })

})
