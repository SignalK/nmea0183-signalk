'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$IIVDR,10.1,T,12.3,M,1.2,N*3A'

chai.Should()
chai.use(require('chai-things'))

describe('VDR', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.current')
      const full = signalkSchema.deltaToFull(delta)
      signalkSchema.fillIdentity(full)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })
})