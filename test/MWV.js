'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('@signalk/signalk-schema')
const should = chai.Should()

chai.use(require('chai-things'))

describe('MWV', () => {
  it('True wind converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleTrueWater')
      delta.updates[0].values.should.contain.an.item.with.property('value', 1.2915436467707015)
      done()
    })

    parser.parse('$IIMWV,074,T,05.85,N,A*2E').catch(e => { done(e) })
  })

  it('Apparent wind converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', function(delta) {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.wind.angleApparent')
      delta.updates[0].values.should.contain.an.item.with.property('value', -0.41887902057428156)
      done()
    })

    parser.parse('$IIMWV,336,R,13.41,N,A*22').catch(e => { done(e) })
  })

  it('Doesn\'t choke on empty sentences', done => {
    new Parser()
    .parse('$IIMWV,,,,*4C')
    .then(result => {
      should.equal(result, null)
      done()
    })
    .catch(e => done(e))
  })
})
