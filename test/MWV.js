'use strict'

const Parser = require('../lib')
const chai = require('chai')
const should = chai.Should()

chai.use(require('chai-things'))

describe('MWV', () => {
  it('True wind converts ok', () => {
    const delta = new Parser().parse('$IIMWV,074,T,05.85,N,A*2E')

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater')
    delta.updates[0].values.should.contain.an.item.with.property('value', 1.2915436467707015)
  })

  it('Apparent wind converts ok', () => {
    const delta = new Parser().parse('$IIMWV,336,R,13.41,N,A*22')

    delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
    delta.updates[0].values.should.contain.an.item.with.property('value', -0.41887902057428156)
  })

  it('Doesn\'t choke on empty sentences', () => {
    const delta = new Parser().parse('$IIMWV,,,,*4C')
    should.equal(delta, null)
  })
})
