'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$IIRPM,E,1,2418.2,10.5,A*5F'

chai.Should()
chai.use(require('chai-things'))

describe('RPM', () => {
  it('converts ok', done => {
    const parser = new Parser
    parser.on('signalk:delta', delta => {
      delta.should.be.validSignalKDelta
      delta.updates[0].values[0].path.should.equal('propulsion.engine1.revolutions')
      const full = signalkSchema.deltaToFull(delta)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })
})
