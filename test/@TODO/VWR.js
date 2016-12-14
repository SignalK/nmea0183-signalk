'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$PIVWR,75,R,1.0,N,0.51,M,1.85,K*75'

chai.Should()
chai.use(require('chai-things'))

describe('VPW', () => {

  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.speedApparent')
      const full = signalkSchema.deltaToFull(delta)
      signalkSchema.fillIdentity(full)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })

})
