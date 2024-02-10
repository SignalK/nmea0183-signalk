'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))
chai.use(require('@signalk/signalk-schema').chaiModule)
const toFull = require('./toFull')

const sentences = [
  '!AIVDM,2,1,0,A,53brRt4000010SG700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*25\n',
  '!AIVDM,2,2,0,A,`0000000001,2*75\n',
]

describe('VDM', function () {
  it('Multiline converts ok', () => {
    const parser = new Parser()
    let delta = parser.parse(sentences[0])
    should.equal(delta, null)

    delta = parser.parse(sentences[1])

    should.not.exist(delta.updates[0].source.label)
    delta.updates[0].source.talker.should.equal('AI')

    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:246326000')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[0]
      .value.mmsi.should.equal('246326000')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[1]
      .value.name.should.equal('UTGERDINA')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[2]
      .value.communication.callsignVhf.should.equal('PH510')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'design.length')
      .value.overall.should.equal(641)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'design.beam')
      .value.should.equal(65)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'design.draft')
      .value.current.should.equal(14.1)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.fromBow')
      .value.should.equal(256)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.fromCenter')
      .value.should.equal(-27.5)
    delta.updates[0].values
      .find(
        (pathValue) => pathValue.path === 'navigation.destination.commonName'
      )
      .value.should.equal('OOI SILEN')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'design.aisShipType')
      .value.id.should.equal(67)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'design.aisShipType')
      .value.name.should.equal('Passenger ship')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.class')
      .value.should.equal('A')

    toFull(delta).should.be.validSignalK
  })

  it('Single line converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,13aEOK?P00PD2wVMdLDRhgvL289?,0*26\n'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:244670316')
  })

  it("Unavailable values don't convert", () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,33@nwqwP?w<ovH0kOqP>4?wp0000,0*0B\n'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:219004903')

    let findPath = should.not.exist(
      delta.updates[0].values.find((pv) => {
        return pv.path === 'navigation.headingTrue'
      })
    )
    should.not.exist(
      delta.updates[0].values.find((pv) => {
        return pv.path === 'navigation.courseOverGroundTrue'
      })
    )
    should.not.exist(
      delta.updates[0].values.find((pv) => {
        return pv.path === 'navigation.speedOverGround'
      })
    )
  })

  it('AtoN converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E>k`sUoJK@@@@@@@@@@@@@@@@@@MAhJS;@neP00000N000,0*0D\n'
    )
    delta.context.should.equal('atons.urn:mrn:imo:mmsi:993672087')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[0]
      .value.mmsi.should.equal('993672087')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[1]
      .value.name.should.equal('46')

    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'navigation.position')
      .value.longitude.should.equal(-76.128155)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'navigation.position')
      .value.latitude.should.equal(39.36828666666667)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'atonType')
      .value.name.should.equal('Beacon, Starboard Hand')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'atonType')
      .value.id.should.equal(14)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.class')
      .value.should.equal('ATON')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'offPosition')
      .value.should.equal(false)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'virtual')
      .value.should.equal(false)
  })

  it('SAR aircraft', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,91b4uGhW1>QjIv@RMAgFlwh20<2L,0*72\n'
    )
    delta.context.should.equal('aircraft.urn:mrn:imo:mmsi:111230303')
    delta.updates[0].values[3].path.should.equal('navigation.position')
    delta.updates[0].values[3].value.longitude.should.equal(24.992333333333335)
    delta.updates[0].values[3].value.latitude.should.equal(60.21876833333334)
    delta.updates[0].values[1].path.should.equal('navigation.speedOverGround')
    delta.updates[0].values[1].value.should.equal(40.12667683209147)
    delta.updates[0].values[2].path.should.equal(
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0].values[2].value.should.equal(3.049090203930291)
  })

  it('class B position report with non-AI talker', () => {
    const delta = new Parser().parse(
      '!BSVDM,1,1,,A,B6CdCm0t3`tba35f@V9faHi7kP06,0*41\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.class')
      .value.should.equal('B')
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('!AIVDM,,,,,,*57')
    should.equal(delta, null)
  })

  it('class A position report with nav status motoring converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'navigation.state')
      .value.should.equal('motoring')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.class')
      .value.should.equal('A')
  })

  it('Off Position AtoN converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E>k`sV6rKP00000000000000000=Al7t;A5E800000N@00,0*43\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'offPosition')
      .value.should.equal(true)
  })

  it('class A position report with specialManeuver converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'navigation.specialManeuver')
      .value.should.equal('not engaged')
  })

  it('class A position report with specialManeuver converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'navigation.specialManeuver')
      .value.should.equal('not engaged')
  })

  it('msg type 8 converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,85Mv070j2d>=<e<<=PQhhg`59P00,0*26'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:366968860')
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.designatedAreaCode')
      .value.should.equal(200)
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'sensors.ais.functionalId')
      .value.should.equal(10)
  })

  it('virtual aton converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E02E340W6@1WPab3bPa200000000:uoH?9Ur000003v010,4*5C\n'
    )
    delta.updates[0].values
      .find((pathValue) => pathValue.path === 'virtual')
      .value.should.equal(true)
  })

  it('imo conerts ok', () => {
    const parser = new Parser()
    let delta = parser.parse(
      '!AIVDM,2,1,9,A,54hi<240?JU9`L<f220l4T@DhhF222222222220U5HD2:40Ht90000000000,0*60'
    )
    should.equal(delta, null)

    delta = parser.parse('!AIVDM,2,2,9,A,00000000002,2*2F')

    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:319573000')
    delta.updates[0].values
      .filter((pathValue) => pathValue.path === '')[3]
      .value.registrations.imo.should.equal('IMO 1010258')
  })

  it('meteo converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,8@2R5Ph0GhOCT1a2VvkrgwvlFR06EuOwgqrqwnSwe7wvlOwwsAwwnSGmwvwt,0*40'
    )
    delta.context.should.equal('meteo.urn:mrn:imo:mmsi:002655619.366097')
    const output = [
      ['environment.water.level', -0.17],
      ['environment.water.levelTendency', 'steady'],
      ['environment.water.levelTendencyValue', 0],
      ['environment.date', '2024-02-22T15:42:00.000Z']
    ]
    output.forEach(([path, value]) =>
      delta.updates[0].values
        .find((pathValue) => pathValue.path === path)
        .value.should.equal(value)
    )
  })

})
