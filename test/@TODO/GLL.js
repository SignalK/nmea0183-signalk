'use strict'

const Parser = require('../lib')
const chai = require('chai')
const nmeaLine = '$GPGLL,5958.613,N,02325.928,E,121022,A,D*40'

chai.Should()
chai.use(require('chai-things'))
chai.use(require('signalk-schema').chaiModule)

describe('GLL', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values[0].path.should.equal('navigation.position')
      delta.updates[0].values[0].value.latitude.should.be.closeTo(59.9768833, 0.000005)
      delta.updates[0].values[0].value.longitude.should.be.closeTo(23.432133, 0.000005)
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(nmeaLine)
  })
})
