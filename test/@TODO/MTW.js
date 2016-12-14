'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$YXMTW,15.2,C*14'

chai.Should()
chai.use(require('chai-things'))

describe('MTW', () => {
  it('converts ok', done => {
    const parser = new Parser
    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.water.temperature')
      delta.updates[0].values[0].value.should.be.closeTo(288.35,0.001)

      const full = signalkSchema.deltaToFull(delta)
      full.should.be.validSignalK
      done()
    })
    parser.parse(nmeaLine)
  })
})
