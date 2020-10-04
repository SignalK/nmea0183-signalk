'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))

describe('VWT', () => {
  it('True wind converts ok', () => {
    const delta = new Parser().parse('$IIVWT,030.,R,10.1,N,05.2,M,018.7,K*75')
//'$IIMWV,074,T,05.85,N,A*2E'
// $IIVWT,030.,R,10.1,N,05.2,M,018.7,K*75

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater')
      delta.updates[0].values[1].value.should.be.closeTo(0.523599, 0.005)
  })


  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIVWT,,,,*55')
    should.equal(delta, null)
  })

})
