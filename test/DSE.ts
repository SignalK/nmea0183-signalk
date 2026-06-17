import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()
chai.use(chaiHasItem as any)

// A distress alert followed by its position-expansion sentence. The DSC
// position is accurate only to the whole minute; the DSE refines it to
// ten-thousandths of a minute.
const dscDistress = '$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A'
const dseExpansion = '$CDDSE,1,1,A,3380400790,00,45894494*1B'

describe('DSE', () => {
  it('refines the position of the preceding DSC sentence', () => {
    const parser = new Parser()
    const dsc = parser.parse(dscDistress) as any
    const coarse = dsc.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.position'
    ).value

    const dse = parser.parse(dseExpansion) as any
    const refined = dse.updates[0]!.values.find(
      (v: any) => v.path === 'navigation.position'
    ).value

    dse.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079')
    refined.latitude.should.be.closeTo(42.5243, 0.0001)
    refined.longitude.should.be.closeTo(-83.2075, 0.0001)
    // Refinement extends magnitude beyond the whole-minute DSC position.
    refined.latitude.should.be.greaterThan(coarse.latitude)
    Math.abs(refined.longitude).should.be.greaterThan(
      Math.abs(coarse.longitude)
    )
  })

  it('returns null when no preceding DSC position is known', () => {
    const delta = new Parser().parse(dseExpansion) as any
    should.equal(delta, null)
  })

  it('ignores multi-sentence DSE groups', () => {
    const parser = new Parser()
    parser.parse(dscDistress)
    const delta = parser.parse('$CDDSE,2,1,A,3380400790,00,45894494*18') as any
    should.equal(delta, null)
  })
})
