'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))

const sentences = [
  '!AIVDM,2,1,0,A,53brRt4000010SG700iE@LE8@Tp4000000000153P615t0Ht0SCkjH4jC1C,0*25\n',
  '!AIVDM,2,2,0,A,`0000000001,2*75\n',
]

// FIXME: This is testing VDM - not VDO
describe('VDO', function () {
  it('Multiline converts ok', () => {
    const parser = new Parser()
    let delta = parser.parse(sentences[0])
    should.equal(delta, null)

    delta = parser.parse(sentences[1])

    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:246326000')
    delta.updates[0].values[0].value.mmsi.should.equal('246326000')
    delta.updates[0].values[1].value.name.should.equal('UTGERDINA')
  })

  it('Single line converts ok', () => {
    const delta = new Parser().parse(
      '!AIVDM,1,1,,A,13aEOK?P00PD2wVMdLDRhgvL289?,0*26\n'
    )
    delta.context.should.equal('vessels.urn:mrn:imo:mmsi:244670316')
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('!AIVDM,,,,,,*57')
    should.equal(delta, null)
  })
})
