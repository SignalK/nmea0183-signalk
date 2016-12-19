'use strict'

const Parser = require('../lib')
const chai = require('chai')
const heading = '$STALK,84,B6,10,00,00,00,00,00,00*14'
const standby = '$STALK,84,E6,15,00,00,00,00,00,08*1E'
const auto = '$STALK,84,56,5E,79,02,00,00,00,08*16'
const wind = '$STALK,84,06,00,00,04,00,00,00,00*63'
const route = '$STALK,84,06,00,00,08,00,00,00,00*6F'
const rudder = '$STALK,84,06,00,00,08,00,FE,00,00*6C'
const heading_nineC = '$STALK,9C,51,1E,00*4B'

chai.Should()
chai.use(require('chai-things'))

describe('ALK', done => {
  it('0x84 heading converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 5.305800926062761
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(heading)
  })

  it('0x84 ap mode: standby converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': 'standby'
      })

      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(standby)
  })

  it('0x84 ap mode: auto converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': 'auto'
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(auto)
  })

  it('0x84 ap mode: wind converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': 'wind'
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(wind)
  })

  it('0x84 ap mode: route converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.autopilot.state',
        'value': 'route'
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(route)
  })

  it('0x84 rudder angle converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.rudderAngle',
        'value': -0.03490658503988659
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(rudder)
  })

  it('0x84 ap target heading  converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'steering.autopilot.target.headingMagnetic',
        'value': 2.626720524251466
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(auto)
  })

  it('0x9C ap target heading  converted', done => {
    const parser = new Parser

    parser.on('signalk:delta', delta => {
      delta.updates[0].values.should.include({
        'path': 'navigation.headingMagnetic',
        'value': 2.6529004630313806
      })
      delta.should.be.validSignalKDelta
      done()
    })

    parser.parse(heading_nineC)
  })
})
