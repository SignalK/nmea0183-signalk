'use strict'

const Parser = require('../lib')
const chai = require('chai')
const signalkSchema = require('signalk-schema')
const nmeaLine_pos = '$CDDSC,20,3381581370,00,21,26,1423108312,1902,,,B,E*7B'
const nmeaLine_distress = '$CDDSC,12,3380400790,12,06,00,1423108312,2019,,,S,E*6A'

chai.Should()
chai.use(require('chai-things'))

describe('DSC Position', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position')
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338158137')
      const full = signalkSchema.deltaToFull(delta)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine_pos)
  })
})

describe('DSC Distress', () => {
  it('converts ok', done => {
    const parser = new Parser

    parser.on('delta', delta => {
      delta.updates[0].values.should.contain.an.item.with.property('path', 'navigation.position')
      delta.updates[0].values.should.contain.an.item.with.property('path', 'notifications.adrift')
      delta.context.should.equal('vessels.urn:mrn:imo:mmsi:338040079')
      const full = signalkSchema.deltaToFull(delta)
      full.should.be.validSignalK
      done()
    })

    parser.parse(nmeaLine_distress)
  })
})
