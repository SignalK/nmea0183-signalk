'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')

chai.Should()
chai.use(require('chai-things'))

describe('VHW', () => {
  it('speed data only', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'navigation.speedThroughWater',
        'value': 3.147222222222222
      })


      signalkSchema.deltaToFull(delta).should.be.validSignalK
      done()
    })

    parser.parse('$IIVHW,,T,,M,06.12,N,11.33,K*50')
  })

  it('speed & direction data', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'navigation.speedThroughWater',
        'value': 0
      })

      delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 3.1730085801256913
      })

      delta.updates[0].values.should.include({
        'path': 'navigation.headingTrue',
        'value': 3.1852258848896517
      })

      signalkSchema.deltaToFull(delta).should.be.validSignalK
      done()
    })

    parser.parse('$SDVHW,182.5,T,181.8,M,0.0,N,0.0,K*4C')
  })
})
