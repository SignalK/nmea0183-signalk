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

// Ship 211000001 first reports its own position (50N 000E), then relays a
// distress for casualty 316200911 at 42-31N 083-12W. The DSE that follows
// the relay carries the relaying ship's address, not the casualty's.
const ownPositionReport =
  '$CDDSC,20,2110000010,00,21,26,0500000000,1902,,,B,E*71'
const distressRelay =
  '$CDDSC,16,2110000010,12,112,00,1423108312,2019,3162009110,12,,E*04'
const relayExpansion = '$CDDSE,1,1,A,2110000010,00,45894494*1A'

// Station 338040079 reports a position, later sends a distress alert with
// no position at all.
const earlierPositionReport =
  '$CDDSC,20,3380400790,00,21,26,0500000000,1902,,,B,E*70'
const distressWithoutPosition = '$CDDSC,12,3380400790,,07,,,,,,,E*3C'

function positionOf(delta: any): { latitude: number; longitude: number } {
  return delta.updates[0]!.values.find(
    (v: any) => v.path === 'navigation.position'
  ).value
}

describe('DSE', () => {
  it('refines the position of the preceding DSC sentence', () => {
    const parser = new Parser()
    const coarse = positionOf(parser.parse(dscDistress))

    const dse = parser.parse(dseExpansion) as any
    const refined = positionOf(dse)

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

  // Use case: a ship relays another vessel's distress, followed by the DSE
  // for the relayed position. The refined position belongs to the casualty;
  // the relaying ship's own earlier fix must stay untouched.
  it('refines a relayed distress under the casualty, not the relaying ship', () => {
    const parser = new Parser()
    parser.parse(ownPositionReport)
    parser.parse(distressRelay)

    const dse = parser.parse(relayExpansion) as any
    const refined = positionOf(dse)

    dse.context.should.equal('vessels.urn:mrn:imo:mmsi:316200911')
    refined.latitude.should.be.closeTo(42.5243, 0.0001)
    refined.longitude.should.be.closeTo(-83.2075, 0.0001)
  })

  // Use case: a distress alert without a position arrives long after the
  // same station's last position report. A DSE following the alert must not
  // "refine" that outdated fix into a fresh-looking position.
  it('does not refine an earlier fix after a DSC without a position', () => {
    const parser = new Parser()
    parser.parse(earlierPositionReport)
    parser.parse(distressWithoutPosition)

    const delta = parser.parse(dseExpansion) as any
    should.equal(delta, null)
  })
})
