import Parser from '../src/lib'
import * as chai from 'chai'
import chaiHasItem from './helpers/chai-has-item'
const should = chai.Should()

chai.use(chaiHasItem as any)

describe('MWV', () => {
  it('True wind converts ok', () => {
    const delta = new Parser().parse('$IIMWV,074,T,05.85,N,A*2E') as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.angleTrueWater'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      1.2915436467707015
    )
  })

  it('Apparent wind converts ok', () => {
    const delta = new Parser().parse('$IIMWV,336,R,13.41,N,A*22') as any

    delta.updates[0]!.values.should.containItemWithProperty(
      'path',
      'environment.wind.angleApparent'
    )
    delta.updates[0]!.values.should.containItemWithProperty(
      'value',
      -0.41887902057428156
    )
  })

  it("Doesn't choke on empty sentences", () => {
    const delta = new Parser().parse('$IIMWV,,,,*4C') as any
    should.equal(delta, null)
  })

  it('Converts wind speed in km/h (K)', () => {
    const delta = new Parser().parse('$IIMWV,074,T,05.85,K,A*2B') as any
    const speed = delta.updates[0]!.values.find(
      (v: any) => v.path === 'environment.wind.speedTrue'
    ).value
    // 5.85 kph -> ~1.625 m/s
    speed.should.be.closeTo(1.625, 0.01)
  })

  it('Defaults to m/s when unit is M', () => {
    const delta = new Parser().parse('$IIMWV,074,T,05.85,M,A*2D') as any
    const speed = delta.updates[0]!.values.find(
      (v: any) => v.path === 'environment.wind.speedTrue'
    ).value
    speed.should.equal(5.85)
  })
})
