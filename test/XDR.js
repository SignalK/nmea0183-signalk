// $IIXDR,C,C,10.7,C,AIRTEMP,A,0.5,D,HEEL,A,-1.-3,D,TRIM,P,1.026,B,BARO,A,A,-4.-3,D,RUDDER*18

const Parser = require('../lib')

const chai = require('chai')
const expect = chai.expect

chai.Should()
chai.use(require('chai-things'))

describe('XDR', () => {
  it('Converts OK using individual parser', () => {
    const delta = new Parser().parse('$IIXDR,C,C,10.7,C,AIRTEMP,A,0.5,D,HEEL,A,-1.-3,D,TRIM,P,1.026,B,BARO,A,A,-4.-3,D,RUDDER*18')
    
    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'environment.outside.temperature'
    )
    delta.updates[0].values[0].value.should.be.closeTo(283.85, 0.005)

    delta.updates[0].values.should.contain.an.item.with.property(
      'path',
      'navigation.attitude.roll'
    )
    delta.updates[0].values[1].value.should.be.closeTo(0.0087, 0.00005)
  })
})
