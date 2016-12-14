'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$IIVPW,4.5,N,6.7,M*52'

chai.Should()
chai.use(require('chai-things'))

describe('VPW', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'performance.velocityMadeGood')
      const full = signalkSchema.deltaToFull(delta)
      signalkSchema.fillIdentity(full)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })

})