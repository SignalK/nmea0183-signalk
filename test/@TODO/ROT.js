'use strict'

const Parser = require('../lib')
const chai = require('chai')
const nmeaLine = '$GPROT,35.6,A*01'

chai.Should()
chai.use(require('chai-things'))

describe('ROT', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.rateOfTurn')
      delta.updates[0].values[0].value.should.equal(35.6 / 180 * Math.PI / 60)
      done()
    })

    parser.parse(nmeaLine)
  })
})
