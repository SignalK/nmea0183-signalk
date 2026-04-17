import Parser from '../src/lib'
import * as chai from 'chai'
import * as signalkSchema from '@signalk/signalk-schema'
const should = chai.Should()

chai.use(signalkSchema.chaiModule as any)
import toFull from './toFull'

const sentences = [
  '!AIVDM,2,1,0,A,53brRt4000010SG700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*25\n',
  '!AIVDM,2,2,0,A,`0000000001,2*75\n'
]

describe('VDM', function () {
  it('Multiline converts ok', () => {
    const parser = new Parser()
    let delta = parser.parse(sentences[0]!) as any
    should.equal(delta, null)

    delta = parser.parse(sentences[1]!) as any

    should.not.exist(delta.updates[0]!.source.label)
    delta.updates[0]!.source.talker.should.equal('AI')

    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:246326000')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[0].value.mmsi.should.equal('246326000')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[1].value.name.should.equal('UTGERDINA')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[2].value.communication.callsignVhf.should.equal('PH510')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'design.length'
    )!.value.overall.should.equal(641)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'design.beam'
    )!.value.should.equal(65)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'design.draft'
    )!.value.current.should.equal(14.1)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.fromBow'
    )!.value.should.equal(256)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.fromCenter'
    )!.value.should.equal(-27.5)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.destination.commonName'
    )!.value.should.equal('OOI SILEN')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'design.aisShipType'
    )!.value.id.should.equal(67)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'design.aisShipType'
    )!.value.name.should.equal('Passenger ship')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.class'
    )!.value.should.equal('A')

    toFull(delta).should.be.validSignalK
  })

  it('AIS type 5 with past-year ETA rolls forward to next year', () => {
    // ETA month=1, day=1: unless run on Jan 1 UTC, this is already past in
    // the current year and should roll to next year.
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,51mg=5D0?JU905=@=<105=@p4lD0000000000016<PjDN0@P0JD0Dm81E0H11Dm00000000,2*32\n'
    ) as any
    const eta = delta.updates[0]!.values.find(
      (pv: any) => pv.path === 'navigation.destination.eta'
    )
    const now = new Date()
    const currentYearEta = new Date(
      Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
    )
    const expectedYear =
      currentYearEta.getTime() < now.getTime()
        ? now.getUTCFullYear() + 1
        : now.getUTCFullYear()
    eta.value.should.equal(
      new Date(Date.UTC(expectedYear, 0, 1, 0, 0, 0, 0)).toISOString()
    )
  })

  it('AIS type 5 with valid ETA produces navigation.destination.eta', () => {
    // Type 5 encoded with etaMo=6, etaDay=15, etaHr=10, etaMin=30.
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,51mg=5D0Bm`L<4hh001@E=A<PU00000000000016<Pj:51WbN=kV@h00000000000000000,2*70\n'
    ) as any
    const etaValue = delta.updates[0]!.values.find(
      (pv: any) => pv.path === 'navigation.destination.eta'
    ).value

    // AIS ETA has no year: current year when still upcoming, else next year.
    const now = new Date()
    const currentYearEta = new Date(
      Date.UTC(now.getUTCFullYear(), 5, 15, 10, 30, 0, 0)
    )
    const expectedYear =
      currentYearEta.getTime() < now.getTime()
        ? now.getUTCFullYear() + 1
        : now.getUTCFullYear()
    const expected = new Date(
      Date.UTC(expectedYear, 5, 15, 10, 30, 0, 0)
    ).toISOString()
    etaValue.should.equal(expected)
  })

  it("AIS type 5 with 'not available' ETA sentinels omits ETA", () => {
    // Type 5 encoded with etaMo=0, etaDay=0, etaHr=24, etaMin=60.
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,51mg=5D0Bm`L<4hh001@E=@p4000000000000016<Pj:500Ht=kSkQ@0000000000000000,2*2D\n'
    ) as any
    should.not.exist(
      delta.updates[0]!.values.find(
        (pv: any) => pv.path === 'navigation.destination.eta'
      )
    )
  })

  it('AIS non-type-5 message does not include ETA', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    ) as any
    should.not.exist(
      delta.updates[0]!.values.find(
        (pv: any) => pv.path === 'navigation.destination.eta'
      )
    )
  })

  it('Single line converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,13aEOK?P00PD2wVMdLDRhgvL289?,0*26\n'
    ) as any
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:244670316')
  })

  it("Unavailable values don't convert", () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,33@nwqwP?w<ovH0kOqP>4?wp0000,0*0B\n'
    ) as any
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:219004903')

    should.not.exist(
      delta.updates[0]!.values.find((pv: any) => {
        return pv.path === 'navigation.headingTrue'
      })
    )
    should.not.exist(
      delta.updates[0]!.values.find((pv: any) => {
        return pv.path === 'navigation.courseOverGroundTrue'
      })
    )
    should.not.exist(
      delta.updates[0]!.values.find((pv: any) => {
        return pv.path === 'navigation.speedOverGround'
      })
    )
    // rot=-128 (no turn information) must not emit a rateOfTurn
    should.not.exist(
      delta.updates[0]!.values.find((pv: any) => {
        return pv.path === 'navigation.rateOfTurn'
      })
    )
  })

  it('AIS rate-of-turn decoding (types 1/2/3)', () => {
    const cases = [
      // sentence,                                                   expectedRad (null = not emitted)
      // Generated via ggencoder.AisEncode with known rot raw values:
      // rot=0  -> not turning (emit 0)
      ['!AIVDM,1,1,,A,13aEOK000j0Fpn0NDrh3Q2mp0000,0*5B', 0],
      // rot=50  -> ~111.6 deg/min right = ~0.03247 rad/s
      ['!AIVDM,1,1,,A,13aEOK0<Pj0Fpn0NDrh3Q2mp0000,0*37', '>0'],
      // rot=-50 -> ~-111.6 deg/min = ~-0.03247 rad/s
      ['!AIVDM,1,1,,A,13aEOK0kPj0Fpn0NDrh3Q2mp0000,0*60', '<0'],
      // rot=127 -> saturated "turning right, no rate available" -> not emitted
      ['!AIVDM,1,1,,A,13aEOK0Ohj0Fpn0NDrh3Q2mp0000,0*7C', null],
      // rot=-127 -> saturated "turning left, no rate available" -> not emitted
      ['!AIVDM,1,1,,A,13aEOK0P@j0Fpn0NDrh3Q2mp0000,0*4B', null],
      // rot=-128 -> no turn information -> not emitted
      ['!AIVDM,1,1,,A,13aEOK0P0j0Fpn0NDrh3Q2mp0000,0*3B', null]
    ]
    for (const [sentence, expected] of cases) {
      const delta = new Parser().parse(sentence + '\n') as any
      const rot = delta.updates[0]!.values.find(
        (pv: any) => pv.path === 'navigation.rateOfTurn'
      )
      if (expected === null) {
        should.not.exist(
          rot,
          `rateOfTurn should not be emitted for ${sentence}`
        )
      } else if (expected === 0) {
        rot.value.should.equal(0)
      } else if (expected === '>0') {
        rot.value.should.be.greaterThan(0)
      } else if (expected === '<0') {
        rot.value.should.be.lessThan(0)
      }
    }
    // Symmetry: rot=+50 and rot=-50 should have equal magnitude, opposite sign
    const pos = (
      (
        new Parser().parse(
          '!AIVDM,1,1,,A,13aEOK0<Pj0Fpn0NDrh3Q2mp0000,0*37\n'
        ) as any
      ).updates[0]!.values.find(
        (pv: any) => pv.path === 'navigation.rateOfTurn'
      ) as any
    ).value as number
    const neg = (
      (
        new Parser().parse(
          '!AIVDM,1,1,,A,13aEOK0kPj0Fpn0NDrh3Q2mp0000,0*60\n'
        ) as any
      ).updates[0]!.values.find(
        (pv: any) => pv.path === 'navigation.rateOfTurn'
      ) as any
    ).value as number
    pos.should.be.closeTo(-neg, 1e-12)
    // Sanity-check the magnitude: rot=50 -> (50/4.733)^2 deg/min -> rad/s.
    // Tolerance is loose enough to absorb the small deg->rad constant delta
    // between utils.transform and Math.PI/180.
    const expectedDegPerMin = Math.pow(50 / 4.733, 2)
    const expectedRadPerSec = (expectedDegPerMin * Math.PI) / 180 / 60
    pos.should.be.closeTo(expectedRadPerSec, 1e-10)
  })

  it('AtoN converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E>k`sUoJK@@@@@@@@@@@@@@@@@@MAhJS;@neP00000N000,0*0D\n'
    ) as any
    delta.context.should.equal('atons.urn:mrn:imo:mmsi:993672087')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[0].value.mmsi.should.equal('993672087')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[1].value.name.should.equal('46')

    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.position'
    )!.value.longitude.should.equal(-76.128155)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.position'
    )!.value.latitude.should.equal(39.36828666666667)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'atonType'
    )!.value.name.should.equal('Beacon, Starboard Hand')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'atonType'
    )!.value.id.should.equal(14)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.class'
    )!.value.should.equal('ATON')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'offPosition'
    )!.value.should.equal(false)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'virtual'
    )!.value.should.equal(false)
  })

  it('SAR aircraft', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,91b4uGhW1>QjIv@RMAgFlwh20<2L,0*72\n'
    ) as any
    delta.context.should.equal('aircraft.urn:mrn:imo:mmsi:111230303')
    delta.updates[0]!.values[3]!.path.should.equal('navigation.position')
    delta.updates[0]!.values[3]!.value.longitude.should.equal(
      24.992333333333335
    )
    delta.updates[0]!.values[3]!.value.latitude.should.equal(60.21876833333334)
    delta.updates[0]!.values[1]!.path.should.equal('navigation.speedOverGround')
    delta.updates[0]!.values[1]!.value.should.equal(40.12667683209147)
    delta.updates[0]!.values[2]!.path.should.equal(
      'navigation.courseOverGroundTrue'
    )
    delta.updates[0]!.values[2]!.value.should.equal(3.049090203930291)
  })

  it('Base station (type 4) is placed under atons context, not vessels', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,403OviQuMGCqWrRO9>E6fE700@GO,0*4D\n'
    ) as any
    delta.context.should.equal('atons.urn:mrn:imo:mmsi:003669702')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.class'
    )!.value.should.equal('BASE')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.position'
    )!.value.longitude.should.equal(-76.35236166666667)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.position'
    )!.value.latitude.should.equal(36.883766666666666)
  })

  it('class B position report with non-AI talker', () => {
    const delta = new Parser().parse(
      '!BSVDM,1,1,,A,B6CdCm0t3`tba35f@V9faHi7kP06,0*41\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.class'
    )!.value.should.equal('B')
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('!AIVDM,,,,,,*57') as any
    should.equal(delta, null)
  })

  it('class A position report with nav status motoring converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.state'
    )!.value.should.equal('motoring')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.class'
    )!.value.should.equal('A')
  })

  it('Off Position AtoN converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E>k`sV6rKP00000000000000000=Al7t;A5E800000N@00,0*43\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'offPosition'
    )!.value.should.equal(true)
  })

  it('class A position report with specialManeuver converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.specialManeuver'
    )!.value.should.equal('not engaged')
  })

  it('class A position report with specialManeuver converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,B,13aGra0P00PHid>NK9<2FOvHR624,0*3E\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'navigation.specialManeuver'
    )!.value.should.equal('not engaged')
  })

  it('msg type 8 converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,85Mv070j2d>=<e<<=PQhhg`59P00,0*26'
    ) as any
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:366968860')
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.designatedAreaCode'
    )!.value.should.equal(200)
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'sensors.ais.functionalId'
    )!.value.should.equal(10)
  })

  it('virtual aton converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,E02E340W6@1WPab3bPa200000000:uoH?9Ur000003v010,4*5C\n'
    ) as any
    delta.updates[0]!.values.find(
      (pathValue: any) => pathValue.path === 'virtual'
    )!.value.should.equal(true)
  })

  it('imo conerts ok', () => {
    const parser = new Parser()
    let delta = parser.parse(
      '!AIVDM,2,1,9,A,54hi<240?JU9`L<f220l4T@DhhF222222222220U5HD2:40Ht90000000000,0*60'
    ) as any
    should.equal(delta, null)

    delta = parser.parse('!AIVDM,2,2,9,A,00000000002,2*2F') as any

    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:319573000')
    delta.updates[0]!.values.filter(
      (pathValue: any) => pathValue.path === ''
    )[3].value.registrations.imo.should.equal('IMO 1010258')
  })

  it('meteo single sentence converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,8@2R5Ph0GhOCT1a2VvkrgwvlFR06EuOwgqrqwnSwe7wvlOwwsAwwnSGmwvwt,0*40'
    ) as any
    delta.context.should.equal('meteo.urn:mrn:imo:mmsi:002655619:366097')
    const currentYear = new Date().getFullYear()
    const currentMonth = ('00' + (new Date().getMonth() + 1)).slice(-2)
    const output = [
      ['environment.water.level', -0.17],
      ['environment.water.levelTendency', 'steady'],
      ['environment.water.levelTendencyValue', 0],
      ['environment.date', `${currentYear}-${currentMonth}-22T15:42:00.000Z`]
    ]
    output.forEach(([path, value]: any) =>
      delta.updates[0]!.values.find(
        (pathValue: any) => pathValue.path === path
      )!.value.should.equal(value)
    )
  })

  it('meteo dual sentence converts ok', () => {
    const meteoSentences = [
      '!AIVDM,2,1,4,A,8@2R5Ph0GhENJAb8wnScjAJ:AB06EuOwgwl?wnSwe7wvlOwwsAwwnSGm,0*15',
      '!AIVDM,2,2,4,A,wvwt,0*10'
    ]
    const parser = new Parser()
    let delta = parser.parse(meteoSentences[0]!) as any
    should.equal(delta, null)
    delta = parser.parse(meteoSentences[1]!) as any
    delta.context.should.equal('meteo.urn:mrn:imo:mmsi:002655619:967728')
    delta.updates[0]!.values[3]!.value.longitude.should.equal(11.7283)
    delta.updates[0]!.values[3]!.value.latitude.should.equal(57.9669)
    const currentYear = new Date().getFullYear()
    const currentMonth = ('00' + (new Date().getMonth() + 1)).slice(-2)
    const output = [
      ['sensors.ais.designatedAreaCode', 1],
      ['sensors.ais.functionalId', 31],
      ['environment.wind.averageSpeed', 9.26],
      ['environment.wind.gust', 11.32],
      ['environment.wind.directionTrue', 4.817108736604238],
      ['environment.wind.gustDirectionTrue', 4.817108736604238],
      ['environment.date', `${currentYear}-${currentMonth}-20T14:47:00.000Z`]
    ]
    output.forEach(([path, value]: any) =>
      delta.updates[0]!.values.find(
        (pathValue: any) => pathValue.path === path
      )!.value.should.equal(value)
    )
  })
})
