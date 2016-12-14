'use strict'

const Parser = require('../lib')
const chai = require("chai")
const signalkSchema = require('signalk-schema')
const nmeaLine = '$IIDBT,035.53,f,010.83,M,005.85,F*23'

chai.Should()
chai.use(require('chai-things'))

describe('DBT', () => {

  it('converts ok', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'environment.depth.belowTransducer')
      done()
    })

    parser.parse(nmeaLine)
  })

})
