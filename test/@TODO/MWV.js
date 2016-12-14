'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine = '$IIMWV,074,T,05.85,N,A*2E'
const emptyNmeaLine = '$IIMWV,,,,*4C'

chai.Should()
chai.use(require('chai-things'))

describe('MWV', () => {
  it('true converts ok', done => {
    const parser = new Parser

    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater')
      delta.updates[0].values.should.contain.an.item.with.property('value', 1.2915436464758039)
      signalkSchema.deltaToFull(delta).should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine)
  })

  it('apparent converts ok', done => {
    const parser = new Parser

    parser.on('delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
      delta.updates[0].values.should.contain.an.item.with.property('value', -0.41887902047863906)
      signalkSchema.deltaToFull(delta).should.be.validSignalK
      done()
    })

    parser.parse('$IIMWV,336,R,13.41,N,A*22')
  })

  it('handles empty fields without throwing errors', done => {
    const parser = new Parser
    parser.parse(emptyNmeaLine)
    done()
  })
})
