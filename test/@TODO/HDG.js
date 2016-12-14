'use strict'

const Parser = require('../lib')
const chai = require('chai')
const headingAndDeviation = '$SDHDG,181.9,,,0.6,E*32'

chai.Should()
chai.use(require('chai-things'))

describe('HDG', () => {
  it('heading and deviation are converted', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values[0].path.should.equal('navigation.headingMagnetic')
      delta.updates[0].values[0].value.should.equal(181.9 / 180 * Math.PI)
      delta.updates[0].values[1].path.should.equal('navigation.magneticVariation')
      delta.updates[0].values[1].value.should.equal(0.6 / 180 * Math.PI)
      done()
    })

    parser.parse(headingAndDeviation)
  })
})
